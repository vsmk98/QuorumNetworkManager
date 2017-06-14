var prompt = require('prompt');

var util = require('./util.js');
var statistics = require('./networkStatistics.js');
var newNetworkSetup = require('./newNetworkSetup.js')
var joinNewNetwork = require('./joinNewNetwork.js')
var rejoinNetork = require('./rejoinNetwork.js')
var newRaftNetwork = require('./newRaftNetwork.js')
var joinRaftNetwork = require('./joinRaftNetwork.js')

prompt.start();
var quorumNetwork = null
var raftNetwork = null
var communicationNetwork = null
var localIpAddress = null
var remoteIpAddress = null
var checkForOtherProcesses = false

var networkStatisticsEnabled = false;
var consensus = null //quorumChain or raft

function handleConsensusChoice(){
  console.log('Please select an option:\n1) Raft\n2) QuorumChain')
  prompt.get(['option'], function(err, answer){
    if(answer.option == 1){
      consensus = 'raft'
    } else if (answer.option == 2){
      consensus = 'quorumChain'
    }
    mainLoop()
  })
}

function handleQuorumConsensus(){
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
  console.log('0) Quit');
  prompt.get(['option'], function (err, result) {
    if (err) { return onErr(err); }
    if(result.option == 1){
      newNetworkSetup.HandleStartingNewQuorumNetwork(localIpAddress, function(err, networks){
        quorumNetwork = networks.quorumNetwork
        communicationNetwork = networks.communicationNetwork
        mainLoop()
      });
    } else if(result.option == 2){
      joinNewNetwork.HandleJoiningNewQuorumNetwork(localIpAddress, function(err, networks){
        quorumNetwork = networks.quorumNetwork
        communicationNetwork = networks.communicationNetwork
        mainLoop();
      });
    } else if(result.option == 3){
      rejoinNetork.HandleRejoiningQuorumNetwork(localIpAddress, function(err, networks){
        quorumNetwork = networks.quorumNetwork
        communicationNetwork = networks.communicationNetwork
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
    } else if(result.option == 0){
      console.log('Quiting');
      process.exit(0);
      return;
    } else {
      mainLoop();
    }
  });
}

function handleRaftConsensus(){
  console.log('Please select an option below:');
  console.log('1) Start a new network as the coordinator [WARNING: this clears everything]')
  console.log('2) Start a new network as a non-coordinator [WARNING: this clears everything]')
  console.log('5) killall geth constellation-node');
  console.log('0) Quit');
  prompt.get(['option'], function(err, result){
    if(result.option == 1){
      newRaftNetwork.HandleStartingNewRaftNetwork(localIpAddress, function(err, networks){
        raftNetwork = networks.raftNetwork
        communicationNetwork = networks.communicationNetwork
        mainLoop()
      })
    } else if(result.option == 2){
      joinRaftNetwork.HandleJoiningRaftNetwork(localIpAddress, function(err, networks){
        raftNetwork = networks.raftNetwork
        communicationNetwork = networks.communicationNetwork
        mainLoop()
      })
    } else if(result.option == 5){
      util.KillallGethConstellationNode(function(err, result){
        if (err) { return onErr(err) }
        raftNetwork = null
        communicationNetwork = null
        mainLoop()
      })
    } else if(result.option == 0){
      console.log('Quiting')
      process.exit(0)
      return
    } else {
      mainLoop()
    }
  })
}

function mainLoop(){
  if(localIpAddress && checkForOtherProcesses == false) {
    util.CheckPreviousCleanExit(function(err, done){
      if(err) {console.log('ERROR:', err)}
      checkForOtherProcesses = done
      mainLoop()
    })
  } else if(localIpAddress && checkForOtherProcesses && consensus === 'quorumChain'){
    handleQuorumConsensus()
  } else if(localIpAddress && checkForOtherProcesses && consensus === 'raft'){
    handleRaftConsensus()
  } else if(localIpAddress && checkForOtherProcesses && consensus == null){
    handleConsensusChoice()
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
