let async = require('async')
let exec = require('child_process').exec
let prompt = require('prompt')
let fs = require('fs')

let whisper = require('./whisperNetwork.js')
let util = require('./util.js')
let constellation = require('./constellation.js')
let statistics = require('./networkStatistics.js')
let peerHandler = require('./peerHandler.js')
let fundingHandler = require('./fundingHandler.js')

prompt.start()

function joinRaftNetwork(config, cb){
  console.log('[*] Starting new network...')

  let seqFunction = async.seq(
    util.ClearDirectories,
    util.CreateDirectories,
    util.GetNewGethAccount,
    util.GenerateNodeKey,    
    util.DisplayEnode,
    getConfiguration,
    constellation.CreateNewKeys, 
    constellation.CreateConfig,
    whisper.JoinNetwork,
    whisper.GetGenesisBlockConfig,
    startRaftNode,
    util.CreateWeb3Connection,
    whisper.AddEnodeResponseHandler,
    peerHandler.ListenForNewEnodes,
    whisper.AddEtherResponseHandler,
    fundingHandler.MonitorAccountBalances,
    statistics.Setup
  )

  let result = {
    localIpAddress: config.localIpAddress,
    folders: ['Blockchain', 'Blockchain/geth', 'Constellation'], 
    constellationKeySetup: [
      {folderName: 'Constellation', fileName: 'node'},
      {folderName: 'Constellation', fileName: 'nodeArch'},
    ],
    constellationConfigSetup: { 
      configName: 'constellation.config', 
      folderName: 'Constellation', 
      localIpAddress : config.localIpAddress, 
      localPort : 9000, // TODO: extract this to a config!
      remoteIpAddress : config.remoteIpAddress, 
      remotePort : 9000, // TODO: extract this to a config! 
      publicKeyFileName: 'node.pub', 
      privateKeyFileName: 'node.key', 
      publicArchKeyFileName: 'nodeArch.pub', 
      privateArchKeyFileName: 'nodeArch.key', 
    },
    "web3IPCHost": './Blockchain/geth.ipc',
    "web3RPCProvider": 'http://localhost:20010'
  }
  seqFunction(result, function(err, res){
    if (err) { return console.log('ERROR', err) }
    console.log('[*] New network started')
    cb(err, res)
  })
}

function startRaftNode(result, cb){
  let options = {encoding: 'utf8', timeout: 100*1000}
  let cmd = './startRaftNode.sh'
  let child = exec(cmd, options)
  child.stdout.on('data', function(data){
    cb(null, result)
  })
  child.stderr.on('data', function(error){
    console.log('ERROR:', error)
    cb(error, null)
  })
}

function askForEnode(result, cb){
  prompt.get(['enode'] , function (err, answer) {
    if(err){console.log('ERROR:', err)}
    if(answer.enode != 0){
      result.enodeList.push(answer.enode)
      askForEnode(result, cb)
    } else {
      cb(null, result)
    }
  })
}

function createStaticNodeFile(enodeList, cb){
  var options = {encoding: 'utf8', timeout: 100*1000};
  let list = ''
  for(let enode of enodeList){
    list += '"'+enode+'",'
  }
  list = list.slice(0, -1)
  var staticNodes = '['
    + list
    +']'
  
  fs.writeFile('Blockchain/static-nodes.json', staticNodes, function(err, res){
    cb(err, res);
  });
}

function getConfiguration(result, cb){
  console.log('Please enter the enodes of other nodes, followed by a 0 when done:')
  askForEnode(result, function(err, result){
    createStaticNodeFile(result.enodeList, function(err, res){
      cb(err, result)
    })
  })
}

function addAddressAsBlockMakerAndVoter(result, cb){
  result.blockMakers = [result.addressList[0]]
  result.blockVoters = [result.addressList[0]]
  result.threshold = 1 
  cb(null, result)
}

function handleJoiningRaftNetwork(localIpAddress, cb){
  config = {}
  config.localIpAddress = localIpAddress
  console.log('In order to join the network, '
    + 'please enter the ip address of the coordinating node')
  prompt.get(['ipAddress'], function (err, network) {
    config.remoteIpAddress = network.ipAddress
    joinRaftNetwork(config, function(err, result){
      if (err) { return console.log('ERROR', err) }
      console.log('Network started')
      config.raftNetwork = Object.assign({}, result)
      let networks = {
        raftNetwork: config.raftNetwork,
        communicationNetwork: config.communicationNetwork
      }
      cb(err, networks)
    })
  })
}

exports.HandleJoiningRaftNetwork = handleJoiningRaftNetwork
