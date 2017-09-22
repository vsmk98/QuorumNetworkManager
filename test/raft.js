const fs = require('fs-extra')
const expect = require('chai').expect

const util = require('../util.js')

const node1Path = 'test/node1'
let newRaftNetwork = null 
let node1Config = null 
let node1 = null

//const node2Path = 'test/node2'

describe("RAFT consensus", function() {
  this.timeout(100*1000)
  describe("Start a coordinating node", function() {
    it("Should start a coordinating raft node", function(done) {
      node1Config.setup.role = 'coordinator'
      node1Config.setup.automatedSetup = true
      node1Config.ports.communicationNode = 50001
      node1Config.ports.communicationNodeRPC = 50011
      node1Config.ports.gethNode = 20001 
      node1Config.ports.gethNodeRPC = 20011
      node1Config.ports.raftHttp = node1Config.ports.gethNode + 20000
      node1Config.ports.constellation = 9001
      newRaftNetwork.HandleStartingNewRaftNetwork(node1Config.setup, function(err, result){
        if(err){console.log('ERROR:', err)} 
        node1 = result
        done()
      })
    })
    it("should have a web3RPC object", function(){
      let web3RPC = node1.raftNetwork.web3RPC
      expect(web3RPC).to.not.be.undefined
    })
    it("should be able to get accounts", function(){
      let web3RPC = node1.raftNetwork.web3RPC
      expect(web3RPC.eth.accounts).to.be.an('array')
    })
    it("should be able to get blockNumber", function(){
      let web3RPC = node1.raftNetwork.web3RPC
      expect(web3RPC.eth.blockNumber).to.equal(0)
    })
    it("should have a web3RPCQuorum object", function(){
      let web3RPCQuorum = node1.raftNetwork.web3RPCQuorum
      expect(web3RPCQuorum).to.not.be.undefined
    })
    it("should be elected as the minter", function(){
      let web3RPCQuorum = node1.raftNetwork.web3RPCQuorum
      expect(web3RPCQuorum.raft.role).to.equal('minter')
    })
    it("should have a web3IPC object", function(){
      let web3IPC = node1.raftNetwork.web3IPC
      expect(web3IPC).to.not.be.undefined
    })
    it("should be able to create an account", function(done){
      let web3IPC = node1.raftNetwork.web3IPC
      web3IPC.personal.newAccount('', function(err, accountAddress){
        if(err){console.log('ERROR:', err)}
        expect(accountAddress).to.be.a('string')
        done()
      })
    })
    it("should be able to transfer between accounts", function(done){
      let web3RPC = node1.raftNetwork.web3RPC
      let account0 = web3RPC.eth.accounts[0]
      let account1 = web3RPC.eth.accounts[1]
      web3RPC.eth.sendTransaction({from:account0, to:account1, value:123}, function(err, txid){
        if(err){console.log('ERROR:', err)}
        expect(txid).to.be.a('string')
        done()
      })
    })
    it("should be able to get balance of account", function(done){
      let web3RPC = node1.raftNetwork.web3RPC
      let account1 = web3RPC.eth.accounts[1]
      web3RPC.eth.getBalance(account1, function(err, balance){
        if(err){console.log('ERROR:', err)}
        let iBalance = Number(balance.toString())
        expect(iBalance).to.equal(123)
        done()
      })
    })
    it("blockNumber should now be 1", function(){
      let web3RPC = node1.raftNetwork.web3RPC
      expect(web3RPC.eth.blockNumber).to.equal(1)
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
