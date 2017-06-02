let async = require('async')
let exec = require('child_process').exec;

let whisper = require('./whisperNetwork.js')
let util = require('./util.js')
let constellation = require('./constellation.js');
let statistics = require('./networkStatistics.js');
let peerHandler = require('./peerHandler.js')
let fundingHandler = require('./fundingHandler.js')

function startNewQuorumNetwork(localIpAddress, communicationNetwork, cb){
  console.log('[*] Starting new network...')
  
  let seqFunction = async.seq(
    util.ClearDirectories,
    util.CreateDirectories,
    constellation.CreateNewKeys, 
    constellation.CreateConfig,
    util.GetNewGethAccount,
    util.GetNewGethAccount,
    util.CreateQuorumConfig,
    util.CreateGenesisBlockConfig,
    startQuorumNode,
    util.CreateWeb3Connection,
    whisper.AddEnodeResponseHandler,
    peerHandler.ListenForNewEnodes,
    whisper.AddEtherResponseHandler,
    fundingHandler.MonitorAccountBalances,
    statistics.Setup
  )

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
      localPort : 9000, // TODO: extract this to a config!
      remoteIpAddress : null, 
      remotePort : 9000, // TODO: extract this to a config! 
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

function handleStartingNewQuorumNetwork(localIpAddress, cb){
  whisper.StartNetwork(function(err, result){
    if (err) { return console.log('ERROR', err) }
    let communicationNetwork = Object.assign({}, result)
    startNewQuorumNetwork(localIpAddress, communicationNetwork, function(err, result){
      if (err) { return console.log('ERROR', err) }
      let quorumNetwork = Object.assign({}, result)
      let networks = {
        quorumNetwork: quorumNetwork,
        communicationNetwork: communicationNetwork
      }
      cb(err, networks)
    })
  }) 
}

exports.HandleStartingNewQuorumNetwork = handleStartingNewQuorumNetwork
