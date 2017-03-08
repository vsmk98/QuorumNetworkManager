var exec = require('child_process').exec;
var fs = require('fs');
var async = require('async');
var prompt = require('prompt');
var util = require('util.js');

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
  var cmd = './startQuorumNode.sh';
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

function startNewQuorumNetwork(cb){
  console.log('[*] Starting new network...');
  
  // done - Create Blockchain and Constellation dirs
  // done - Create constellation keys
  // Get ip address to use
  // Update constellation config with correct ip address
  // done - Create two new geth accounts
  // done - Create genesis block config with above two accounts, one BM + one BV
  // done - Create quorum-genesis.json from above config
  // done - Init genesis block from quorum-genesis.json
  // Start boot node with correct ip address
  // done - Start constellation node
  // done - Start node
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
  // Web3 IPC
  var Web3IPC = require('web3_ipc');
  var options = {
    host: './CommunicationNode/geth.ipc',
    ipc: true,
    personal: true,
    admin: true,
    debug: false
  };
  var web3IPC = Web3IPC.create(options);
  result.web3IPC = web3IPC;
  // Web3 RPC
  var Web3RPC = require('web3');
  var web3RPC = new Web3RPC();
  web3RPC.setProvider(new web3RPC.providers.HttpProvider('http://localhost:40010'));
  result.web3RPC = web3RPC;
  cb(null, result);
}

function connectToPeer(result, cb){
  console.log('Adding peer...');
  var enode = "enode://9443bd2c5ccc5978831088755491417fe0c3866537b5e9638bcb6ad34cb9bcc58a9338bb492590ff200a54b43a6a03e4a7e33fa111d0a7f6b7192d1ca050f300@192.168.88.238:40000";
  result.web3IPC.admin.addPeer(enode, function(err, res){
    console.log('Added peer');
    if(err){console.log('ERROR:', err);}
    console.log('res:', res);
    cb(null, res);
  });
}

function addCommunicationHandler(result, cb){
  result.web3RPC.shh.filter({"topics":["NewPeer"]}).watch(function(err, msg) {
    if(err){console.log("ERROR:", err);};
    var message = util.Hex2a(msg.payload);
    console.log("New message on NewPeer:");
    console.log(message);
  });

  cb(null, result);
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

  var result = {};
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
    connectToPeer,
    addCommunicationHandler
  );

  var result = {
    "remoteIpAddress": ipAddress,
    "remotePort": 40000
  };
  newNetworkSetup(result, function(err, res){
    if (err) { return onErr(err); }
    console.log('[*] New communication network started');
    cb(err, res); 
  });
}

function joinQuorumNetwork(cb){
/*
  console.log('[*] Starting new network...');
  
  // done - Create Blockchain and Constellation dirs
  // done - Create constellation keys
  // Get ip address to use
  // Update constellation config with correct ip address
  // done - Create two new geth accounts
  // done - Create genesis block config with above two accounts, one BM + one BV
  // done - Create quorum-genesis.json from above config
  // done - Init genesis block from quorum-genesis.json
  // Start boot node with correct ip address
  // done - Start constellation node
  // done - Start node
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
    folders: ['Blockchain', 'Constellation'] 
  };
  newNetworkSetup(result, function(err, res){
    if (err) { return onErr(err); }
    console.log('[*] New network started');
    console.log('res:', res);
    cb(err, res); 
  });*/
}

function mainLoop(){
  var quorumNetwork = null;
  var communicationNetwork = null;
  prompt.start();
  console.log('Please select an option below:');
  console.log('1) Start new network');
  console.log('2) killall geth bootnode constellation-node');
  console.log('3) Start communication network');
  console.log('4) Join communication network');
  console.log('5) Join Quorum network');
  console.log('0) Quit');
  prompt.get(['option'], function (err, result) {
    if (err) { return onErr(err); }
    if(result.option == 1){
      startNewQuorumNetwork(function(err, result){
        if (err) { return onErr(err); }
        quorumNetwork = result;
        mainLoop();
      });
    } else if(result.option == 2){
      killallGethBootnodeConstellationNode(function(err, result){
        if (err) { return onErr(err); }
        quorumNetwork = null;
        communicationNetwork = null;
        mainLoop();
      });      
    } else if(result.option == 3){
      if(communicationNetwork == null){
        startCommunicationNetwork(function(err, result){
          if (err) { return onErr(err); }
          communicationNetwork = result;
          mainLoop();
        });  
      } else {
        console.log('Communication network already started');
        mainLoop();
      }   
    } else if(result.option == 4){
      if(communicationNetwork == null){ 
        prompt.get(['ipAddress'], function (err, network) {
          joinCommunicationNetwork(network.ipAddress, function(err, result){
            if (err) { return onErr(err); }
            communicationNetwork = result;
            mainLoop();
          });      
        });  
      } else {
        console.log('Already joined a communication network');
        mainLoop();
      }    
    } else if(result.option == 5){
      if(communicationNetwork){ 
        joinQuorumNetwork(communicationNetwork, function(err, result){
          if (err) { return onErr(err); }
          quorumNetwork = result;
          mainLoop();
        });      
      } else {
        console.log('Please join a communication network first');
        mainLoop();
      }    
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
