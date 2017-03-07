var exec = require('child_process').exec;
var fs = require('fs');
var async = require('async');
var prompt = require('prompt');

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
  cmd += ' Blockchain';
  cmd += ' Blockchain2';
  cmd += ' Constellation';
  cmd += ' Constellation2';
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
  cmd += ' Blockchain';
  cmd += ' Blockchain2';
  cmd += ' Constellation';
  cmd += ' Constellation2';
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

  var result = {};
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

function startCommunicationNetwork(cb){
  console.log('[*] Starting communication network...');
  
  // Create communication node
  // Copy nodekey - this nodekey will be static, across deployments
  // Get ip address to use
  // Start node
  var newNetworkSetup = async.seq(
    clearCommunicationFolder,
    createCommunicationFolder,
    copyCommunicationNodeKey,
    getIpAddress,
    startCommunicationNode
  );

  var result = {};
  newNetworkSetup(result, function(err, res){
    if (err) { return onErr(err); }
    console.log('[*] New communication network started');
    console.log('res:', res);
    cb(err, res); 
  });
}

function mainLoop(){
  prompt.start();
  console.log('Please select an option below:');
  console.log('1) Start new network');
  console.log('2) killall geth bootnode constellation-node');
  console.log('3) Start communication network');
  console.log('4) Join communication network');
  console.log('0) Quit');
  prompt.get(['option'], function (err, result) {
    if (err) { return onErr(err); }
    if(result.option == 1){
      startNewQuorumNetwork(function(err, result){
        if (err) { return onErr(err); }
        mainLoop();
      });
    } else if(result.option == 2){
      killallGethBootnodeConstellationNode(function(err, result){
        if (err) { return onErr(err); }
        mainLoop();
      });      
    } else if(result.option == 3){
      startCommunicationNetwork(function(err, result){
        if (err) { return onErr(err); }
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
