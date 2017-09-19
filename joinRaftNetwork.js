let async = require('async')
let exec = require('child_process').exec
let prompt = require('prompt')
let fs = require('fs')

let whisper = require('./Communication/whisperNetwork.js')
let util = require('./util.js')
let constellation = require('./constellation.js')
let statistics = require('./networkStatistics.js')
let peerHandler = require('./peerHandler.js')
let fundingHandler = require('./fundingHandler.js')
let ports = require('./config.js').ports

prompt.start()

function displayGethAccount(result, cb){
  console.log('Account:', result.addressList[0])
  cb(null, result)
}

function startRaftNode(result, cb){
  let options = {encoding: 'utf8', timeout: 100*1000}
  let cmd = './startRaftNode.sh'
  cmd += ' '+ports.gethNodeRPC
  cmd += ' '+ports.gethNode
  cmd += ' '+ports.raftHttp
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

function joinRaftNetwork(config, cb){
  console.log('[*] Starting new network...')

  let seqFunction = async.seq(
    util.ClearDirectories,
    util.CreateDirectories,
    util.GetNewGethAccount,
    displayGethAccount,
    util.GenerateNodeKey,    
    util.DisplayEnode,
    constellation.CreateNewKeys, 
    constellation.CreateConfig,
    whisper.RequestNetworkMembership,
    whisper.GetGenesisBlockConfig,
    whisper.GetStaticNodesFile,
    startRaftNode,
    util.CreateWeb3Connection,
    util.UnlockAllAccounts,
    whisper.AddEnodeResponseHandler,
    peerHandler.ListenForNewEnodes,
    whisper.AddEtherResponseHandler,
    fundingHandler.MonitorAccountBalances,
    statistics.Setup
  )

  let result = {
    localIpAddress: config.localIpAddress,
    remoteIpAddress : config.remoteIpAddress, 
    folders: ['Blockchain', 'Blockchain/geth', 'Constellation'], 
    constellationKeySetup: [
      {folderName: 'Constellation', fileName: 'node'},
      {folderName: 'Constellation', fileName: 'nodeArch'},
    ],
    constellationConfigSetup: { 
      configName: 'constellation.config', 
      folderName: 'Constellation', 
      localIpAddress : config.localIpAddress, 
      localPort : ports.constellation,
      remoteIpAddress : config.remoteIpAddress, 
      remotePort : ports.constellation,
      publicKeyFileName: 'node.pub', 
      privateKeyFileName: 'node.key', 
      publicArchKeyFileName: 'nodeArch.pub', 
      privateArchKeyFileName: 'nodeArch.key', 
    },
    communicationNetwork: config.communicationNetwork,
    "web3IPCHost": './Blockchain/geth.ipc',
    "web3RPCProvider": 'http://localhost:'+ports.gethNodeRPC
  }
  seqFunction(result, function(err, res){
    if (err) { return console.log('ERROR', err) }
    console.log('[*] New network started')
    cb(err, res)
  })
}

function handleJoiningRaftNetwork(options, cb){
  config = {}
  config.localIpAddress = options.localIpAddress
  console.log('In order to join the network, '
    + 'please enter the ip address of the coordinating node')
  prompt.get(['ipAddress'], function (err, network) {
    config.remoteIpAddress = network.ipAddress
    whisper.JoinCommunicationNetwork(config, function(err, result){
      if (err) { return console(err) }
      config.communicationNetwork = Object.assign({}, result)
      joinRaftNetwork(config, function(err, result){
        if (err) { return console.log('ERROR', err) }
        let networks = {
          raftNetwork: Object.assign({}, result),
          communicationNetwork: config.communicationNetwork
        }
        cb(err, networks)
      })
    })
  })
}

exports.HandleJoiningRaftNetwork = handleJoiningRaftNetwork
