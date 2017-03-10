var exec = require('child_process').exec;
var fs = require('fs');
var async = require('async');
var prompt = require('prompt');
var util = require('./util.js');
var events = require('./eventEmitter.js');

function killallGethBootnodeConstellationNode(cb){
  var cmd = 'killall -9';
  cmd += ' geth';
  cmd += ' constellation-node';
  var child = exec(cmd, function(){
    cb(null, null);
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

function clearDirectories(result, cb){
  var cmd = 'rm -rf';
  for(var i in result.folders){
    var folder = result.folders[i];
    cmd += ' '+folder;    
  }
  var child = exec(cmd, function(){
    cb(null, result);
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

function createDirectories(result, cb){
  var cmd = 'mkdir';
  for(var i in result.folders){
    var folder = result.folders[i];
    cmd += ' '+folder;    
  }
  var child = exec(cmd, function(){
    cb(null, result);
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

function createNewConstellationKeys(result, cb){
  var counter = result.constellationKeySetup.length;
  var cmd = "";
  for(var i in result.constellationKeySetup){
    var folderName = result.constellationKeySetup[i].folderName;
    var fileName = result.constellationKeySetup[i].fileName;
    cmd += 'cd '+folderName+' && constellation-enclave-keygen '+fileName+' && cd .. && '; 
  }
  cmd = cmd.substring(0, cmd.length-4);
  var child = exec(cmd);
  child.stdout.on('data', function(data){
    if(data.indexOf('Lock key pair') >= 0){
      child.stdin.write('\n');
      counter--;
      if(counter <= 0){
        cb(null, result);
      } 
    } else {
      console.log('Unexpected data:', data);
      cb(null, result);
    }
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

function createConstellationConfig(result, cb){
  var c = result.constellationConfigSetup;
  var config = 'url = "http://'+c.localIpAddress+':'+c.localPort+'/"\n';
  config += 'port = '+c.localPort+'\n';
  config += 'socketPath = "'+c.folderName+'/socket.ipc"\n';
  config += 'otherNodeUrls = ["http://'+c.remoteIpAddress+':'+c.remotePort+'/"]\n';
  config += 'publicKeyPath = "'+c.folderName+'/'+c.publicKeyFileName+'"\n';
  config += 'privateKeyPath = "'+c.folderName+'/'+c.privateKeyFileName+'"\n';
  config += 'archivalPublicKeyPath = "'+c.folderName+'/'+c.publicArchKeyFileName+'"\n';
  config += 'archivalPrivateKeyPath = "'+c.folderName+'/'+c.privateArchKeyFileName+'"\n';
  config += 'storagePath = "'+c.folderName+'/data"';
  fs.writeFile(c.configName, config, function(err, res){
    cb(err, result);
  });
}

function getNewGethAccount(result, cb){
  var options = {encoding: 'utf8', timeout: 10*1000};
  var child = exec('geth --datadir Blockchain account new', options);
  child.stdout.on('data', function(data){
    if(data.indexOf('Your new account') >= 0){
      child.stdin.write('\n');
    } else if(data.indexOf('Repeat') >= 0){
      child.stdin.write('\n');
    } else if(data.indexOf('Address') == 0){
      var index = data.indexOf('{');
      var address = '0x'+data.substring(index+1, data.length-2);
      if(result.addressList == undefined){
        result.addressList = [];
      }
      result.addressList.push(address);
      cb(null, result);
    } 
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

function createQuorumConfig(result, cb){
  console.log('creating genesis config...');
  var options = {encoding: 'utf8', timeout: 100*1000};
  var config = '{'
    +'"threshold": 1,'
    +'"voters": ['
    + '"'+result.addressList[1]+'"'
    +'],'
    +'"makers": ["'+result.addressList[0]+'"]'
  +'}';

  fs.writeFile('quorum-config.json', config, function(err, res){
    console.log('created genesis config');
    cb(err, result);
  });
}

function createGenesisBlockConfig(result, cb){
  console.log('creating genesis block config...');
  var options = {encoding: 'utf8', timeout: 100*1000};
  var child = exec('quorum-genesis', options, function(error, stderr, stdout){
    console.log('created genesis block config');
    cb(null, result);
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

function startQuorumNode(result, cb){
  var options = {encoding: 'utf8', timeout: 100*1000};
  var cmd = './startQuorumBMAndBVNodes.sh';
  cmd += ' '+result.addressList[1];
  cmd += ' '+result.addressList[0];
  var child = exec(cmd, options);
  child.stdout.on('data', function(data){
    cb(null, result);
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

function startQuorumParticipantNode(result, cb){
  console.log('Starting quorum participant node...');
  var options = {encoding: 'utf8', timeout: 100*1000};
  var cmd = './startQuorumParticipantNode.sh';
  var child = exec(cmd, options);
  child.stdout.on('data', function(data){
    console.log('Started quorum participant node');
    cb(null, result);
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
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

function createWeb3Connection(result, cb){
  console.log('Creating web3 connections...');
  // Web3 IPC
  var host = result.web3IPCHost;
  var Web3IPC = require('web3_ipc');
  var options = {
    host: host,
    ipc: true,
    personal: true,
    admin: true,
    debug: false
  };
  var web3IPC = Web3IPC.create(options);
  result.web3IPC = web3IPC;
  // Web3 RPC
  var httpProvider = result.web3RPCProvider;
  var Web3RPC = require('web3');
  var web3RPC = new Web3RPC();
  web3RPC.setProvider(new web3RPC.providers.HttpProvider(httpProvider));
  result.web3RPC = web3RPC;
  console.log('Created web3 connections');
  cb(null, result);
}

function listenToNewEnodes(result, cb){
  var web3IPC = result.web3IPC;
  events.on('newEnode', function(enode){
    result.web3IPC.admin.addPeer(enode, function(err, res){
      if(err){console.log('ERROR:', err);}
    });
  });
  cb(null, result);
}

function connectToPeer(result, cb){
  console.log('Adding peer...');
  var enode = result.enode;
  result.web3IPC.admin.addPeer(enode, function(err, res){
    console.log('Added peer');
    if(err){console.log('ERROR:', err);}
    cb(null, result);
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

// TODO: Add to and from fields to validate origins & only respond to others requests
// TODO: Add check whether requester has correct permissions
// This will broadcast this node's enode to any 'request|enode' message
function addEnodeCommunicationHandler(result, cb){
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
        enodeResponse = enodeResponse.replace('\[\:\:\]', localIpAddress);
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
function getEnodeForQuorumNetwork(result, cb){
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
        filter.stopWatching();
        var enode = message.replace('response|enode', '').substring(1);
        events.emit('newEnode', enode);
        result.enode = enode;
        cb(err, result);
      }
    });
  });
}

function startCommunicationNetwork(cb){
  console.log('[*] Starting communication network...');
  var newNetworkSetup = async.seq(
    clearDirectories,
    createDirectories,
    copyCommunicationNodeKey,
    startCommunicationNode,
    createWeb3Connection,
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

function joinCommunicationNetwork(cb){
  console.log('[*] Joining communication network...');
  var newNetworkSetup = async.seq(
    clearDirectories,
    createDirectories,
    startCommunicationNode,
    createWeb3Connection,
    connectToPeer
  );

  var result = {
    folders: ['CommunicationNode', 'CommunicationNode/geth'], 
    "managingNodeIpAddress": remoteIpAddress,
    "web3IPCHost": './CommunicationNode/geth.ipc',
    "web3RPCProvider": 'http://localhost:40010',
    "enode": "enode://9443bd2c5ccc5978831088755491417fe0c3866537b5e9638bcb6ad34cb9bcc58a9338bb492590ff200a54b43a6a03e4a7e33fa111d0a7f6b7192d1ca050f300@"+remoteIpAddress+":40000"
  };
  newNetworkSetup(result, function(err, res){
    if (err) { return onErr(err); }
    console.log('[*] New communication network started');
    cb(err, res); 
  });
}

function startNewQuorumNetwork(communicationNetwork, cb){
  console.log('[*] Starting new network...');
  
  var newNetworkSetup = async.seq(
    clearDirectories,
    createDirectories,
    createNewConstellationKeys, 
    createConstellationConfig,
    getNewGethAccount,
    getNewGethAccount,
    createQuorumConfig,
    createGenesisBlockConfig,
    startQuorumNode,
    createWeb3Connection,
    addEnodeCommunicationHandler,
    listenToNewEnodes
  );

  var result = {
    communicationNetwork: communicationNetwork,
    folders: ['Blockchain', 'Constellation'], 
    constellationKeySetup: [
      {folderName: 'Constellation', fileName: 'node'},
      {folderName: 'Constellation', fileName: 'nodeArch'},
    ],
    constellationConfigSetup: { 
      configName: 'constellation.config', 
      folderName: 'Constellation', 
      localIpAddress : localIpAddress, 
      localPort : 9000, 
      remoteIpAddress : remoteIpAddress, 
      remotePort : 9000, 
      publicKeyFileName: 'node.pub', 
      privateKeyFileName: 'node.key', 
      publicArchKeyFileName: 'nodeArch.pub', 
      privateArchKeyFileName: 'nodeArch.key', 
    },
    "web3IPCHost": './Blockchain/geth.ipc',
    "web3RPCProvider": 'http://localhost:20010',
  };
  newNetworkSetup(result, function(err, res){
    if (err) { return onErr(err); }
    console.log('[*] New network started');
    cb(err, res); 
  });
}

function joinQuorumNetwork(communicationNetwork, cb){
  console.log('[*] Joining existing quorum network...');
  
  var newNetworkSetup = async.seq(
    clearDirectories,
    createDirectories,
    createNewConstellationKeys, 
    createConstellationConfig,
    getGenesisBlockConfig,
    startQuorumParticipantNode,
    createWeb3Connection,
    listenToNewEnodes,
    getEnodeForQuorumNetwork
  );

  var result = {
    folders: ['Blockchain', 'Constellation'],
    constellationKeySetup: [
      {folderName: 'Constellation', fileName: 'node'},
      {folderName: 'Constellation', fileName: 'nodeArch'}
    ],
    constellationConfigSetup: { 
      configName: 'constellation.config', 
      folderName: 'Constellation', 
      localIpAddress : localIpAddress, 
      localPort : 9000, 
      remoteIpAddress : remoteIpAddress, 
      remotePort : 9000, 
      publicKeyFileName: 'node.pub', 
      privateKeyFileName: 'node.key', 
      publicArchKeyFileName: 'nodeArch.pub', 
      privateArchKeyFileName: 'nodeArch.key', 
    },
    communicationNetwork: communicationNetwork,
    "web3IPCHost": './Blockchain/geth.ipc',
    "web3RPCProvider": 'http://localhost:20010'
  };
  newNetworkSetup(result, function(err, res){
    if (err) { return onErr(err); }
    console.log('[*] New network started');
    cb(err, res); 
  });
}

prompt.start();
var quorumNetwork = null;
var communicationNetwork = null;
var localIpAddress = null;
var remoteIpAddress = null;

function handleStartingNewQuorumNetwork(cb){
  startCommunicationNetwork(function(err, result){
    if (err) { return onErr(err); }
    communicationNetwork = Object.assign({}, result);
    result = null;
    startNewQuorumNetwork(communicationNetwork, function(err, result){
      if (err) { return onErr(err); }
      quorumNetwork = Object.assign({}, result);
      result = null;
      cb();
    });
  });  
}

function handleJoiningExistingQuorumNetwork(cb){
  console.log('In order to join an existing network, '
    + 'please enter the ip address of one of the managing nodes');
  prompt.get(['ipAddress'], function (err, network) {
    remoteIpAddress = network.ipAddress;
    joinCommunicationNetwork(function(err, result){
      if (err) { return onErr(err); }
      communicationNetwork = Object.assign({}, result);
      result = null;
      joinQuorumNetwork(communicationNetwork, function(err, result){
        if (err) { return onErr(err); }
        quorumNetwork = Object.assign({}, result);
        result = null;
        cb();
      }); 
    });      
  });  
}

function mainLoop(){
  if(localIpAddress){
    console.log('Please select an option below:');
    console.log('1) Start new Quorum network');
    console.log('2) Join an existing Quorum network');
    console.log('3) killall geth constellation-node');
    console.log('0) Quit');
    prompt.get(['option'], function (err, result) {
      if (err) { return onErr(err); }
      if(result.option == 1){
        handleStartingNewQuorumNetwork(function(){
          mainLoop();
        });
      } else if(result.option == 2){
        handleJoiningExistingQuorumNetwork(function(){
          mainLoop();
        });
      } else if(result.option == 3){
        killallGethBootnodeConstellationNode(function(err, result){
          if (err) { return onErr(err); }
          quorumNetwork = null;
          communicationNetwork = null;
          mainLoop();
        });      
      } else if(result.option == 0){
        console.log('Quiting');
        return;
      } else {
        mainLoop();
      }
    });
  } else {
    console.log('Welcome! Before we get started, please enter the IP address '
      +'other nodes will use to connect to this node.');
    prompt.get(['localIpAddress'], function (err, answer) {
      localIpAddress = answer.localIpAddress;
      mainLoop();
    });
  }
}

function onErr(err) {
  console.log(err);
  return 1;
}

mainLoop();
