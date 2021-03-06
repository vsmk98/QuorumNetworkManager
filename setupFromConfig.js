let config = require('./config.js')
let newRaftNetwork = require('./newRaftNetwork.js')
let joinExisting = require('./joinExistingRaftNetwork.js')

function setup(){
  console.log('[SetupFromConfig] Starting setup from config')
  if(config.setup.consensus === 'raft'){
    if(config.setup.role === 'coordinator'){
      config.setup.automatedSetup = true
      newRaftNetwork.HandleStartingNewRaftNetwork(config.setup, function(err, result){
        if(err){console.log('ERROR:', err)} 
        console.log('[SetupFromConfig] All done. Leave this running, ideally inside screen')
      })
    } else if (config.setup.role === 'non-coordinator'){
      console.log('TODO: non-coordinator')
    } else if (config.setup.role === 'dynamicPeer'){
      config.setup.automatedSetup = true
      joinExisting.HandleJoiningRaftNetwork(config.setup, function(err, result){
        if(err){console.log('ERROR:', err)} 
        console.log('[SetupFromConfig] All done. Leave this running, ideally inside screen')
      })
    } else {
      console.log('Unsupported option:', config.setup.role)
    }    
  } else {
    console.log('raft is the only consensus option currently supported by this setup')
  }
}

setup()
