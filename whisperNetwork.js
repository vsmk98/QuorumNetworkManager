var exec = require('child_process').exec;
var fs = require('fs');
var async = require('async');

var events = require('./eventEmitter.js');
var util = require('./util.js');

// TODO: Maybe check that address is indeed in need of some ether before sending it some
// TODO: Check from which address to send the ether, for now this defaults to eth.accounts[0]
function requestSomeEther(commWeb3RPC, address, cb){
  var message = 'request|ether|'+address;
  var hexString = new Buffer(message).toString('hex');        
  commWeb3RPC.shh.post({
    "topics": ["Ether"],
    "payload": hexString,
    "ttl": 10,
    "workToProve": 1
  }, function(err, res){
    if(err){console.log('err', err);}
    cb();
  });
}

// TODO: Maybe check that address is indeed in need of some ether before sending it some
// TODO: Check from which address to send the ether, for now this defaults to eth.accounts[0]
function addEtherResponseHandler(result, cb){
  var web3RPC = result.web3RPC;
  var commWeb3RPC = result.communicationNetwork.web3RPC;
  commWeb3RPC.shh.filter({"topics":["Ether"]}).watch(function(err, msg) {
    if(err){console.log("ERROR:", err);};
    var message = null;
    if(msg && msg.payload){
      message = util.Hex2a(msg.payload);
    }
    if(message && message.indexOf('request|ether|') >= 0){
      var address = message.substring('request|ether|'.length+1);
      
      var transaction = {
        from: web3RPC.eth.accounts[0],
        to: address,
        value: web3RPC.toWei(1, 'ether')
      };
      web3RPC.eth.sendTransaction(transaction, function(err, res){
        if(err){console.log('err', err);}
      });
    }
  });
  cb(null, result);
}

// TODO: Add to and from fields to validate origins & only respond to others requests
// TODO: Add check whether requester has correct permissions
// This will broadcast this node's enode to any 'request|enode' message
function addEnodeResponseHandler(result, cb){
  let web3RPC = result.web3RPC
  let web3IPC = result.web3IPC
  let commWeb3RPC = result.communicationNetwork.web3RPC
  let commWeb3IPC = result.communicationNetwork.web3IPC
  commWeb3RPC.shh.filter({"topics":["Enode"]}).watch(function(err, msg) {
    if(err){console.log("ERROR:", err)}
    var message = null
    if(msg && msg.payload){
      message = util.Hex2a(msg.payload)
    }
    if(message && message.indexOf('request|enode') >= 0){
      web3IPC.admin.nodeInfo(function(err, nodeInfo){
        if(err){console.log('ERROR:', err)}
        var enodeResponse = 'response|enode'+nodeInfo.enode
        enodeResponse = enodeResponse.replace('\[\:\:\]', result.localIpAddress)
        var hexString = new Buffer(enodeResponse).toString('hex')
        commWeb3RPC.shh.post({
          "topics": ["Enode"],
          "payload": hexString,
          "ttl": 10,
          "workToProve": 1
        }, function(err, res){
          if(err){console.log('err', err);}
        })
      })
    }
  })
  cb(null, result)
}

// TODO: Add to and from fields to validate origins & only respond to others requests
// TODO: Test assumption that we want to connect to all nodes that respond with enodes
// This requests other nodes for their enode and then waits for a response
function addEnodeRequestHandler(result, cb){
  var comm = result.communicationNetwork;
  var shh = comm.web3RPC.shh;
  
  var id = shh.newIdentity();
  var str = "request|enode";
  var hexString = new Buffer(str).toString('hex');

  setInterval(function(){
    shh.post({
      "from": id,
      "topics": ["Enode"],
      "payload": hexString,
      "ttl": 10,
      "workToProve": 1
    }, function(err, res){
      if(err){console.log('err', err)}
    })
  }, 10*1000)

  var filter = shh.filter({"topics":["Enode"]}).watch(function(err, msg) {
    if(err){console.log("ERROR:", err);};
    var message = null;
    if(msg && msg.payload){
      message = util.Hex2a(msg.payload);
    }
    if(message && message.indexOf('response|enode') >= 0){
      var enode = message.replace('response|enode', '').substring(1);
      events.emit('newEnode', enode);
    }
  })
  
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
    var message = null;
    if(msg && msg.payload){
      message = util.Hex2a(msg.payload);
    } 
    if(message && message.indexOf('request|genesisConfig') >= 0){
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

  console.log('[*] Requesting genesis block config. This will block until the other node is online')

  var shh = result.communicationNetwork.web3RPC.shh;
  
  var id = shh.newIdentity();
  var str = "request|genesisConfig";
  var hexString = new Buffer(str).toString('hex');

  var receivedGenesisConfig = false

  var intervalID = setInterval(function(){
    if(receivedGenesisConfig){
      clearInterval(intervalID)
    } else {
      shh.post({
        "from": id,
        "topics": ["GenesisConfig"],
        "payload": hexString,
        "ttl": 10,
        "workToProve": 1
      }, function(err, res){
        if(err){console.log('err', err)}
      })
    }
  }, 5000)

  var filter = shh.filter({"topics":["GenesisConfig"]}).watch(function(err, msg) {
    if(err){console.log("ERROR:", err)}
    var message = null
    if(msg && msg.payload){
      message = util.Hex2a(msg.payload)
    }
    if(message && message.indexOf('response|genesisConfig') >= 0){
      console.log('received genesis config')
      if(receivedGenesisConfig == false){
        receivedGenesisConfig = true
        filter.stopWatching()
        var genesisConfig = message.replace('response|genesisConfig', '').substring(1)
        genesisConfig = genesisConfig.replace(/\\n/g, '')
        genesisConfig = genesisConfig.replace(/\\/g, '')
        fs.writeFile('quorum-genesis.json', genesisConfig, function(err, res){
          cb(err, result)
        })
      }
    }
  })
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

function startCommunicationNetwork(result, cb){
  console.log('[*] Starting communication network...')
  let networkSetup = async.seq(
    util.ClearDirectories,
    util.CreateDirectories,
    copyCommunicationNodeKey,
    startCommunicationNode,
    util.CreateWeb3Connection,
    genesisConfigHandler    
  )

  let config = {
    folders: ['CommunicationNode', 'CommunicationNode/geth'], 
    "web3IPCHost": './CommunicationNode/geth.ipc',
    "web3RPCProvider": 'http://localhost:50010'
  }
  networkSetup(config, function(err, commNet){
    if (err) { console.log('ERROR:', err) }
    console.log('[*] New communication network started')
    result.communicationNetwork = commNet
    cb(err, result)
  })
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
    "web3RPCProvider": 'http://localhost:50010',
    "enode": "enode://9443bd2c5ccc5978831088755491417fe0c3866537b5e9638bcb6ad34cb9bcc58a9338bb492590ff200a54b43a6a03e4a7e33fa111d0a7f6b7192d1ca050f300@"+remoteIpAddress+":50000"
  };
  seqFunction(result, function(err, commNet){
    if (err) { return onErr(err); }
    console.log('[*] Communication network started');
    cb(err, commNet); 
  });
}


exports.StartNetwork = startCommunicationNetwork
exports.JoinNetwork = joinCommunicationNetwork
exports.AddEtherResponseHandler = addEtherResponseHandler
exports.AddEnodeResponseHandler = addEnodeResponseHandler
exports.AddEnodeRequestHandler = addEnodeRequestHandler
exports.GetGenesisBlockConfig = getGenesisBlockConfig
exports.RequestSomeEther = requestSomeEther
