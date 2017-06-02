var exec = require('child_process').exec;
var fs = require('fs');
var async = require('async');
var prompt = require('prompt');

var util = require('./util.js');
var events = require('./eventEmitter.js');
var whisper = require('./whisperNetwork.js');
var constellation = require('./constellation.js');
var statistics = require('./networkStatistics.js');
var chainBuilder = require('./chainBuilder.js')

prompt.start();
var quorumNetwork = null;
var communicationNetwork = null;
var localIpAddress = null;
var remoteIpAddress = null;
var checkForOtherProcesses = false;

function listenForNewEnodes(result, cb){
  var web3IPC = result.web3IPC;
  events.on('newEnode', function(enode){
    web3IPC.admin.addPeer(enode, function(err, res){
      if(err){console.log('ERROR:', err);}
    });
  });
  cb(null, result);
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

function accountDiff(arrayA, arrayB){
  var arrayC = []
  for(var i in arrayA){
    var itemA = arrayA[i]
    var found = false
    for(var j in arrayB){
      var itemB = arrayB[j]
      if(itemA === itemB){
        found = true
      }
    }
    if(found === false){
      arrayC.push(itemA)
    }
  }
  return arrayC
}

var processedAccounts = []
function getAllBalancesForThisNode(result, cb){
  var thresholdBalance = 0.1;

  var commWeb3RPC = result.communicationNetwork.web3RPC;
  var web3RPC = result.web3RPC;
  var accounts = accountDiff(web3RPC.eth.accounts, processedAccounts)

  for(var i in accounts){
    var account = accounts[i];
    var balance = web3RPC.fromWei(web3RPC.eth.getBalance(account).toString(), 'ether');
    // if balance is below threshold, request topup
    if(balance < thresholdBalance){
      whisper.RequestSomeEther(commWeb3RPC, account, function(){
        processedAccounts.push(account)
      })
    }    
  }
  cb(null, result);
}

function monitorAccountBalances(result, cb){
  var web3RPC = result.web3RPC;
  setInterval(function(){
    getAllBalancesForThisNode(result, function(){ }); 
  }, 5*1000);
  cb(null, result);
}

function startNewQuorumNetwork(communicationNetwork, cb){
  console.log('[*] Starting new network...');
  
  var seqFunction = async.seq(
    util.ClearDirectories,
    util.CreateDirectories,
    constellation.CreateNewKeys, 
    constellation.CreateConfig,
    util.GetNewGethAccount,
    util.GetNewGethAccount,
    createQuorumConfig,
    createGenesisBlockConfig,
    startQuorumNode,
    util.CreateWeb3Connection,
    whisper.AddEnodeResponseHandler,
    listenForNewEnodes,
    whisper.AddEtherResponseHandler,
    monitorAccountBalances,
    statistics.Setup
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
    monitorAccountBalances,
    statistics.Setup
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
    monitorAccountBalances,
    statistics.Setup
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

var networkStatisticsEnabled = false;
function mainLoop(){
  if(localIpAddress && checkForOtherProcesses == false) {
    util.CheckPreviousCleanExit(function(err, done){
      if(err) {console.log('ERROR:', err)}
      checkForOtherProcesses = done
      mainLoop()
    })
  } else if(localIpAddress && checkForOtherProcesses){
    console.log('Please select an option below:');
    console.log('1) Start a new Quorum network [WARNING: this clears everything]');
    console.log('2) Join an existing Quorum network, first time joining this network. [WARNING: this clears everything]');
    console.log('3) Reconnect to the previously connected network');
    if(networkStatisticsEnabled){
      console.log('4) Display network statistics');
    } else {
      console.log('4) Enable network statistics');
    }
    console.log('5) killall geth constellation-node');
    if(quorumNetwork){
      console.log('Advanced setup')
      console.log('6) Add block maker by address')
      console.log('7) Add block voter by address')
    }
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
      } else if(networkStatisticsEnabled == false && result.option == 4){
        statistics.Enable();
        networkStatisticsEnabled = true;
        mainLoop();
      } else if(networkStatisticsEnabled == true && result.option == 4){
        statistics.PrintBlockStatistics();
        mainLoop();
      } else if(result.option == 5){
        util.KillallGethConstellationNode(function(err, result){
          if (err) { return onErr(err); }
          quorumNetwork = null;
          communicationNetwork = null;
          mainLoop();
        });      
      } /*else if(quorumNetwork && result.option == 6){ // Add block maker
        chainBuilder.AddBlockMaker(quorumNetwork, function(){
          mainLoop()
        }) 
      } else if(quorumNetwork && result.option == 7){ // Add block voter
        chainBuilder.AddBlockVoter(quorumNetwork, function(){
          mainLoop()
        }) 
      }*/ else if(result.option == 0){
        console.log('Quiting');
        process.exit(0);
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
