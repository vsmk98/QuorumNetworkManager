var exec = require('child_process').exec;
var fs = require('fs');
var async = require('async');
var prompt = require('prompt');
var util = require('./util.js');

function killallGethBootnodeConstellationNode(cb){
  var cmd = 'killall';
  cmd += ' geth';
  cmd += ' bootnode';
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
  var child = exec('cd Constellation && constellation-enclave-keygen node');
  child.stdout.on('data', function(data){
    if(data == 'Lock key pair node with password [none]: '){
      child.stdin.write('\n');
      cb(null, result);
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

function createNewConstellationArchiveKeys(result, cb){
  var child = exec('cd Constellation && constellation-enclave-keygen nodeArch');
  child.stdout.on('data', function(data){
    if(data == 'Lock key pair nodeArch with password [none]: '){
      child.stdin.write('\n');
      cb(null, result);
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

function createNewConstellationKeys2(result, cb){
  var child = exec('cd Constellation2 && constellation-enclave-keygen node');
  child.stdout.on('data', function(data){
    if(data == 'Lock key pair node with password [none]: '){
      child.stdin.write('\n');
      cb(null, result);
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

function createNewConstellationArchiveKeys2(result, cb){
  var child = exec('cd Constellation2 && constellation-enclave-keygen nodeArch');
  child.stdout.on('data', function(data){
    if(data == 'Lock key pair nodeArch with password [none]: '){
      child.stdin.write('\n');
      cb(null, result);
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

function getIpAddress(result, cb){
  var ipAddress = "192.168.88.238";
  result.ipAddress = ipAddress;
  cb(null, result);
}

function updateConstellationConfig(result, cb){
  cb(null, result);
}

function getNewGethAccount(result, cb){
  var options = {encoding: 'utf8', timeout: 10*1000};
  var child = exec('geth --datadir Blockchain account new', options);
  child.stdout.on('data', function(data){
    if(data.indexOf('Your new account') == 0){
      child.stdin.write('\n');
    } else if(data.indexOf('Repeat') == 1){
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

function getNewGethAccount2(result, cb){
  var options = {encoding: 'utf8', timeout: 10*1000};
  var child = exec('geth --datadir Blockchain2 account new', options);
  child.stdout.on('data', function(data){
    if(data.indexOf('Your new account') == 0){
      child.stdin.write('\n');
    } else if(data.indexOf('Repeat') == 1){
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
  var options = {encoding: 'utf8', timeout: 100*1000};
  var config = '{'
    +'"threshold": 1,'
    +'"voters": ['
    + '"'+result.addressList[1]+'",'
    + '"'+result.addressList[2]+'"'
    +'],'
    +'"makers": ["'+result.addressList[0]+'"]'
  +'}';

  fs.writeFile('quorum-config.json', config, function(err, res){
    cb(err, result);
  });
}

function createGenesisBlockConfig(result, cb){
  var options = {encoding: 'utf8', timeout: 100*1000};
  var child = exec('quorum-genesis', options, function(error, stderr, stdout){
    cb(null, result);
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

function startQuorumNode(result, cb){
  var options = {encoding: 'utf8', timeout: 100*1000};
  var cmd = './startQuorumBMAndBVNode.sh';
  cmd += ' '+result.addressList[1];
  cmd += ' '+result.addressList[0];
  cmd += ' '+result.addressList[2];
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

function clearCommunicationFolder(result, cb){
  var cmd = 'rm -rf';
  cmd += ' CommunicationNode';
  var child = exec(cmd, function(){
    cb(null, result);
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

function createCommunicationFolder(result, cb){
  var cmd = 'mkdir';
  cmd += ' CommunicationNode';
  cmd += ' && mkdir';
  cmd += ' CommunicationNode/geth';
  var child = exec(cmd, function(){
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
function addCommunicationHandler(result, cb){
  var shh = result.web3RPC.shh;
  shh.filter({"topics":["NewPeer"]}).watch(function(err, msg) {
    if(err){console.log("ERROR:", err);};
    var message = util.Hex2a(msg.payload);
    if(message.indexOf('request|genesisConfig') >= 0){
      fs.readFile('quorum-genesis.json', 'utf8', function(err, data){
        if(err){console.log('ERROR:', err);}   
        var genesisConfig = 'response|genesisConfig'+JSON.stringify(data);
        var hexString = new Buffer(genesisConfig).toString('hex');        
        console.log('Created hex string');
        shh.post({
          "topics": ["NewPeer"],
          "payload": hexString,
          "ttl": 10,
          "workToProve": 1
        }, function(err, res){
          if(err){console.log('err', err);}
          console.log('Message sent:', res);
        });
      });
    }
  });

  cb(null, result);
}

// TODO: Add to and from fields to validate origins
// TODO: Unsubscribe once genesisConfig has been received
function getGenesisBlockConfig(result, cb){
  var shh = result.communicationNetwork.web3RPC.shh;
  
  var id = shh.newIdentity();
  var str = "request|genesisConfig";
  var hexString = new Buffer(str).toString('hex');

  shh.post({
    "from": id,
    "topics": ["NewPeer"],
    "payload": hexString,
    "ttl": 10,
    "workToProve": 1
  }, function(err, res){
    if(err){console.log('err', err);}
    shh.filter({"topics":["NewPeer"]}).watch(function(err, msg) {
      if(err){console.log("ERROR:", err);};
      var message = util.Hex2a(msg.payload);
      if(message.indexOf('response|genesisConfig') >= 0){
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

function startCommunicationNetwork(cb){
  console.log('[*] Starting communication network...');
  var newNetworkSetup = async.seq(
    clearCommunicationFolder,
    createCommunicationFolder,
    copyCommunicationNodeKey,
    getIpAddress,
    startCommunicationNode,
    createWeb3Connection,
    addCommunicationHandler
  );

  var result = {
    "web3IPCHost": './CommunicationNode/geth.ipc',
    "web3RPCProvider": 'http://localhost:40010'
  };
  newNetworkSetup(result, function(err, res){
    if (err) { return onErr(err); }
    console.log('[*] New communication network started');
    cb(err, res); 
  });
}

function joinCommunicationNetwork(ipAddress, cb){
  console.log('[*] Joining communication network...');
  var newNetworkSetup = async.seq(
    clearCommunicationFolder,
    createCommunicationFolder,
    startCommunicationNode,
    createWeb3Connection,
    connectToPeer
  );

  var result = {
    "remoteIpAddress": ipAddress,
    "remotePort": 40000,
    "web3IPCHost": './CommunicationNode/geth.ipc',
    "web3RPCProvider": 'http://localhost:40010',
    "enode": "enode://9443bd2c5ccc5978831088755491417fe0c3866537b5e9638bcb6ad34cb9bcc58a9338bb492590ff200a54b43a6a03e4a7e33fa111d0a7f6b7192d1ca050f300@192.168.88.238:40000"
  };
  newNetworkSetup(result, function(err, res){
    if (err) { return onErr(err); }
    console.log('[*] New communication network started');
    cb(err, res); 
  });
}

function startNewQuorumNetwork(cb){
  console.log('[*] Starting new network...');
  
  var newNetworkSetup = async.seq(
    clearDirectories,
    createDirectories,
    createNewConstellationKeys, 
    createNewConstellationArchiveKeys,
    createNewConstellationKeys2, 
    createNewConstellationArchiveKeys2,
    getIpAddress,
    updateConstellationConfig,
    getNewGethAccount,
    getNewGethAccount,
    getNewGethAccount2,
    createQuorumConfig,
    createGenesisBlockConfig,
    startQuorumNode
  );

  var result = {
    folders: ['Blockchain', 'Blockchain2', 'Constellation', 'Constellation2'] 
  };
  newNetworkSetup(result, function(err, res){
    if (err) { return onErr(err); }
    console.log('[*] New network started');
    console.log('res:', res);
    cb(err, res); 
  });
}

function joinQuorumNetwork(communicationNetwork, cb){
  console.log('[*] Joining quorum network...');
  
  var newNetworkSetup = async.seq(
    clearDirectories,
    createDirectories,
    createNewConstellationKeys, 
    createNewConstellationArchiveKeys,
    getIpAddress,
    updateConstellationConfig,
    getGenesisBlockConfig,
    startQuorumParticipantNode,
    createWeb3Connection,
    connectToPeer
  );

  var result = {
    folders: ['Blockchain', 'Constellation'],
    communicationNetwork: communicationNetwork,
    "web3IPCHost": './Blockchain/geth.ipc',
    "web3RPCProvider": 'http://localhost:20010',
    "enode": "enode://7203f2bd24e561307e88046ae95f7b29e3b7d9407660d27e6f6abc09210df8942e437cc42d41e5127b566d7f7389f9bfd6fe1c09a8170eac5d2af96ca7efa3ce@192.168.88.238:20000"
  };
  newNetworkSetup(result, function(err, res){
    if (err) { return onErr(err); }
    console.log('[*] New network started');
    cb(err, res); 
  });
}

var quorumNetwork = null;
var communicationNetwork = null;
function mainLoop(){
  prompt.start();
  console.log('Please select an option below:');
  console.log('1) Start new Quorum network');
  console.log('2) Join an existing Quorum network');
  console.log('3) killall geth bootnode constellation-node');
  console.log('0) Quit');
  prompt.get(['option'], function (err, result) {
    if (err) { return onErr(err); }
    if(result.option == 1){
      startCommunicationNetwork(function(err, result){
        if (err) { return onErr(err); }
        communicationNetwork = Object.assign({}, result);
        result = null;
        startNewQuorumNetwork(function(err, result){
          if (err) { return onErr(err); }
          quorumNetwork = Object.assign({}, result);
          result = null;
          mainLoop();
        });
      });  
    } else if(result.option == 2){
      console.log('In order to join an existing network, '
        + 'please enter the ip address of one of the managing nodes');
      prompt.get(['ipAddress'], function (err, network) {
        joinCommunicationNetwork(network.ipAddress, function(err, result){
          if (err) { return onErr(err); }
          communicationNetwork = Object.assign({}, result);
          result = null;
          joinQuorumNetwork(communicationNetwork, function(err, result){
            if (err) { return onErr(err); }
            quorumNetwork = Object.assign({}, result);
            result = null;
            mainLoop();
          }); 
        });      
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
}

function onErr(err) {
  console.log(err);
  return 1;
}

mainLoop();
