var config = {}

config.ports = {}

config.ports.communicationNode = 50000
config.ports.communicationNodeRPC = 50010
config.ports.gethNode = 20000 // Changing this will change the raftHttp port!
config.ports.gethNodeRPC = 20010
config.ports.raftHttp = config.ports.gethNode + 20000  // This is a requirement from raftHttp!
config.ports.devp2p = 30303
config.ports.constellation = 9000

module.exports = config
