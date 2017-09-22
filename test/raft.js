const fs = require('fs-extra')
const expect = require('chai').expect

const util = require('../util.js')

const node1Path = 'test/node1'
let newRaftNetwork = null 
let node1Config = null 

//const node2Path = 'test/node2'

describe("RAFT consensus", function() {
  this.timeout(100*1000)
  describe("Start a coordinating node", function() {
    it("Should start a coordinating raft node", function(done) {
      node1Config.setup.role = 'coordinator'
      node1Config.setup.automatedSetup = true
      newRaftNetwork.HandleStartingNewRaftNetwork(node1Config.setup, function(err, result){
        if(err){console.log('ERROR:', err)} 
        console.log('[SetupFromConfig] All done. Leave this running, ideally inside screen')
        done()
      })
    })
  })
  before(function(done){
    if (fs.existsSync(node1Path)){
      fs.removeSync(node1Path)
    }
    fs.mkdirSync(node1Path)
    fs.copySync('.', node1Path, {filter: copyFilter})
    newRaftNetwork = require('./node1/newRaftNetwork.js')
    node1Config = require('./node1/config.js')
    done()
  })
  after(function(done){
    util.KillallGethConstellationNode(function(){
      done()
    })    
  })
})

function copyFilter(src, dest){
  if(src.indexOf('Blockchain') >= 0){
    return false
  } else if(src.indexOf('test') >= 0){
    return false
  } else if(src.indexOf('.log') >= 0){
    return false
  } else if(src.indexOf('README.md') >= 0){
    return false
  } else if(src.indexOf('Constellation') >= 0){
    return false
  } else if(src.indexOf('CommunicationNode') >= 0){
    return false
  } else if(src.indexOf('git') >= 0){
    return false
  } else if(src.indexOf('swp') >= 0){
    return false
  } else {
    return true
  }
}
