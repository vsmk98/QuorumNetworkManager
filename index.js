var exec = require('child_process').exec;
var fs = require('fs');
var async = require('async');
var prompt = require('prompt');

var util = require('./util.js');
var events = require('./eventEmitter.js');
var whisper = require('./whisperNetwork.js');
var constellation = require('./constellation.js');

function listenForNewEnodes(result, cb){
  var web3IPC = result.web3IPC;
  events.on('newEnode', function(enode){
    web3IPC.admin.addPeer(enode, function(err, res){
      if(err){console.log('ERROR:', err);}
    });
  });
  cb(null, result);
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


function getAllBalancesForThisNode(result, cb){
  var thresholdBalance = 0.1;

  var commWeb3RPC = result.communicationNetwork.web3RPC;
  var web3RPC = result.web3RPC;
  var accounts = web3RPC.eth.accounts;
  for(var i in accounts){
    var account = accounts[i];
    var balance = web3RPC.fromWei(web3RPC.eth.getBalance(account).toString(), 'ether');
    // if balance is below threshold, request topup
    if(balance < thresholdBalance){
      whisper.RequestSomeEther(commWeb3RPC, account, function(){}); 
    }    
  }
  
  cb();
}

function monitorAccountBalances(result, cb){
  var web3RPC = result.web3RPC;
  web3RPC.eth.filter("latest", function(err, block) { 
    getAllBalancesForThisNode(result, function(){ }); 
  });
  cb(null, result);
}

function startNewQuorumNetwork(communicationNetwork, cb){
  console.log('[*] Starting new network...');
  
  var seqFunction = async.seq(
    util.ClearDirectories,
    util.CreateDirectories,
    constellation.CreateNewKeys, 
    constellation.CreateConfig,
    getNewGethAccount,
    getNewGethAccount,
    createQuorumConfig,
    createGenesisBlockConfig,
    startQuorumNode,
    util.CreateWeb3Connection,
    whisper.AddEnodeResponseHandler,
    listenForNewEnodes,
    whisper.AddEtherResponseHandler
  );

  var result = {
    localIpAddress: localIpAddress,
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
  seqFunction(result, function(err, res){
    if (err) { return onErr(err); }
    console.log('[*] New network started');
    cb(err, res); 
  });
}

function joinQuorumNetwork(communicationNetwork, cb){
  console.log('[*] Joining existing quorum network...');
  
  var seqFunction = async.seq(
    util.ClearDirectories,
    util.CreateDirectories,
    constellation.CreateNewKeys, 
    constellation.CreateConfig,
    whisper.GetGenesisBlockConfig,
    startQuorumParticipantNode,
    util.CreateWeb3Connection,
    listenForNewEnodes,
    whisper.AddEnodeRequestHandler,
    whisper.AddEnodeResponseHandler,
    monitorAccountBalances
  );

  var result = {
    localIpAddress: localIpAddress,
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
  seqFunction(result, function(err, res){
    if (err) { return onErr(err); }
    console.log('[*] New network started');
    cb(err, res); 
  });
}

function reconnectToQuorumNetwork(communicationNetwork, cb){
  console.log('[*] Reconnecting to existing quorum network...');
  
  var seqFunction = async.seq(
    startQuorumParticipantNode,
    util.CreateWeb3Connection,
    listenForNewEnodes,
    whisper.AddEnodeRequestHandler,
    whisper.AddEnodeResponseHandler,
    monitorAccountBalances
  );

  var result = {
    localIpAddress: localIpAddress,
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
  seqFunction(result, function(err, res){
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
  whisper.StartNetwork(function(err, result){
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
    whisper.JoinNetwork(remoteIpAddress, function(err, result){
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

function handleReconnectingToQuorumNetwork(cb){
  console.log('In order to reconnect, '
    + 'please enter the ip address of one of the managing nodes');
  prompt.get(['ipAddress'], function (err, network) {
    remoteIpAddress = network.ipAddress;
    whisper.JoinNetwork(remoteIpAddress, function(err, result){
      if (err) { return onErr(err); }
      communicationNetwork = Object.assign({}, result);
      result = null;
      reconnectToQuorumNetwork(communicationNetwork, function(err, result){
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
    console.log('1) Start a new Quorum network [WARNING: this clears everything]');
    console.log('2) Join an existing Quorum network, first time joining this network. [WARNING: this clears everything]');
    console.log('3) Reconnect to the previously connected network');
    console.log('4) killall geth constellation-node');
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
        handleReconnectingToQuorumNetwork(function(){
          mainLoop();
        });
      } else if(result.option == 4){
        util.KillallGethConstellationNode(function(err, result){
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
