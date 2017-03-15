var exec = require('child_process').exec;
var fs = require('fs');
var async = require('async');

var events = require('./eventEmitter.js');
var util = require('./util.js');

// TODO: Maybe check that address is indeed in need of some ether before sending it some
// TODO: Check from which address to send the ether, for now this defaults to eth.accounts[0]
function addEtherResponseHandler(result, cb){
  var web3RPC = result.web3RPC;
  var commWeb3RPC = result.communicationNetwork.web3RPC;
  commWeb3RPC.shh.filter({"topics":["Ether"]}).watch(function(err, msg) {
    if(err){console.log("ERROR:", err);};
    var message = util.Hex2a(msg.payload);
    if(message.indexOf('request|ether|') >= 0){
      var address = message.replace('request|ether|');
      
      var transaction = {
        from: web3RPC.eth.accounts[0],
        to: address,
        value: web3.toWei(1, 'ether')
      };
      console.log('transaction:', transaction);
      web3RPC.eth.sendTransaction(transaction, function(err, res){
        if(err){console.log('err', err);}
        console.log('addEnodeResponseHandler:', res);
      });
    }
  });
  cb(null, result);
}

// TODO: Add to and from fields to validate origins & only respond to others requests
// TODO: Add check whether requester has correct permissions
// This will broadcast this node's enode to any 'request|enode' message
function addEnodeResponseHandler(result, cb){
  var web3RPC = result.web3RPC;
  var web3IPC = result.web3IPC;
  var commWeb3RPC = result.communicationNetwork.web3RPC;
  var commWeb3IPC = result.communicationNetwork.web3IPC;
  commWeb3RPC.shh.filter({"topics":["Enode"]}).watch(function(err, msg) {
    if(err){console.log("ERROR:", err);};
    var message = util.Hex2a(msg.payload);
    if(message.indexOf('request|enode') >= 0){
      web3IPC.admin.nodeInfo(function(err, nodeInfo){
        if(err){console.log('ERROR:', err);}
        var enodeResponse = 'response|enode'+nodeInfo.enode;
        enodeResponse = enodeResponse.replace('\[\:\:\]', result.localIpAddress);
        var hexString = new Buffer(enodeResponse).toString('hex');        
        commWeb3RPC.shh.post({
          "topics": ["Enode"],
          "payload": hexString,
          "ttl": 10,
          "workToProve": 1
        }, function(err, res){
          if(err){console.log('err', err);}
        });
      });
    }
  });
  cb(null, result);
}

// TODO: Add to and from fields to validate origins & only respond to others requests
// TODO: Test assumption that we want to connect to all nodes that respond with enodes
function addEnodeRequestHandler(result, cb){
  var comm = result.communicationNetwork;
  var shh = comm.web3RPC.shh;
  
  var id = shh.newIdentity();
  var str = "request|enode";
  var hexString = new Buffer(str).toString('hex');

  shh.post({
    "from": id,
    "topics": ["Enode"],
    "payload": hexString,
    "ttl": 10,
    "workToProve": 1
  }, function(err, res){
    if(err){console.log('err', err);}
    var filter = shh.filter({"topics":["Enode"]}).watch(function(err, msg) {
      if(err){console.log("ERROR:", err);};
      var message = util.Hex2a(msg.payload);
      if(message.indexOf('response|enode') >= 0){
        var enode = message.replace('response|enode', '').substring(1);
        events.emit('newEnode', enode);
      }
    });
  });
  cb(null, result);
}


function copyCommunicationNodeKey(result, cb){
  var cmd = 'cp communicationNodeKey CommunicationNode/geth/nodekey';
  var child = exec(cmd, function(){
    cb(null, result);
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

// TODO: Add check whether requester has correct permissions
function genesisConfigHandler(result, cb){
  var web3RPC = result.web3RPC;
  var web3IPC = result.web3IPC;
  web3RPC.shh.filter({"topics":["GenesisConfig"]}).watch(function(err, msg) {
    if(err){console.log("ERROR:", err);};
    var message = util.Hex2a(msg.payload);
    if(message.indexOf('request|genesisConfig') >= 0){
      fs.readFile('quorum-genesis.json', 'utf8', function(err, data){
        if(err){console.log('ERROR:', err);}   
        var genesisConfig = 'response|genesisConfig'+data;
        var hexString = new Buffer(genesisConfig).toString('hex');        
        web3RPC.shh.post({
          "topics": ["GenesisConfig"],
          "payload": hexString,
          "ttl": 10,
          "workToProve": 1
        }, function(err, res){
          if(err){console.log('err', err);}
        });
      });
    }
  });
  cb(null, result);
}

// TODO: Add to and from fields to validate origins
function getGenesisBlockConfig(result, cb){
  var shh = result.communicationNetwork.web3RPC.shh;
  
  var id = shh.newIdentity();
  var str = "request|genesisConfig";
  var hexString = new Buffer(str).toString('hex');

  shh.post({
    "from": id,
    "topics": ["GenesisConfig"],
    "payload": hexString,
    "ttl": 10,
    "workToProve": 1
  }, function(err, res){
    if(err){console.log('err', err);}
    var filter = shh.filter({"topics":["GenesisConfig"]}).watch(function(err, msg) {
      if(err){console.log("ERROR:", err);};
      var message = util.Hex2a(msg.payload);
      if(message.indexOf('response|genesisConfig') >= 0){
        filter.stopWatching();
        var genesisConfig = message.replace('response|genesisConfig', '').substring(1);
        genesisConfig = genesisConfig.replace(/\\n/g, '');
        genesisConfig = genesisConfig.replace(/\\/g, '');
        fs.writeFile('quorum-genesis.json', genesisConfig, function(err, res){
          cb(err, result);
        });
      }
    });
  });
}



function startCommunicationNode(result, cb){
  var options = {encoding: 'utf8', timeout: 100*1000};
  var cmd = './startCommunicationNode.sh';
  var child = exec(cmd, options);
  child.stdout.on('data', function(data){
    cb(null, result);
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

function startCommunicationNetwork(cb){
  console.log('[*] Starting communication network...');
  var newNetworkSetup = async.seq(
    util.ClearDirectories,
    util.CreateDirectories,
    copyCommunicationNodeKey,
    startCommunicationNode,
    util.CreateWeb3Connection,
    genesisConfigHandler    
  );

  var result = {
    folders: ['CommunicationNode', 'CommunicationNode/geth'], 
    "web3IPCHost": './CommunicationNode/geth.ipc',
    "web3RPCProvider": 'http://localhost:40010'
  };
  newNetworkSetup(result, function(err, res){
    if (err) { return onErr(err); }
    console.log('[*] New communication network started');
    cb(err, res); 
  });
}

function joinCommunicationNetwork(remoteIpAddress, cb){
  console.log('[*] Joining communication network...');
  var seqFunction = async.seq(
    util.ClearDirectories,
    util.CreateDirectories,
    startCommunicationNode,
    util.CreateWeb3Connection,
    util.ConnectToPeer
  );

  var result = {
    folders: ['CommunicationNode', 'CommunicationNode/geth'], 
    "managingNodeIpAddress": remoteIpAddress,
    "web3IPCHost": './CommunicationNode/geth.ipc',
    "web3RPCProvider": 'http://localhost:40010',
    "enode": "enode://9443bd2c5ccc5978831088755491417fe0c3866537b5e9638bcb6ad34cb9bcc58a9338bb492590ff200a54b43a6a03e4a7e33fa111d0a7f6b7192d1ca050f300@"+remoteIpAddress+":40000"
  };
  seqFunction(result, function(err, res){
    if (err) { return onErr(err); }
    console.log('[*] New communication network started');
    cb(err, res); 
  });
}


exports.StartNetwork = startCommunicationNetwork;
exports.AddEtherResponseHandler = addEtherResponseHandler;
exports.AddEnodeResponseHandler = addEnodeResponseHandler;
exports.AddEnodeRequestHandler = addEnodeRequestHandler;
exports.JoinNetwork = joinCommunicationNetwork;
exports.GetGenesisBlockConfig = getGenesisBlockConfig;
