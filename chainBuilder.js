
// TODO: get correct address instead of assuming address 0
function addBlockMaker(quorumNetwork, cb){
  let blockMakerAddress = quorumNetwork.web3RPC.eth.accounts[0]
  console.log('blockMakerAddress:', blockMakerAddress) 
  let isBlockMaker = quorumNetwork.web3RPC.quorum.isBlockMaker(blockMakerAddress)
  console.log('isBlockMaker:', isBlockMaker) 
  cb()
}

function addBlockVoter(quorumNetwork, cb){
  let blockVoterAddress = quorumNetwork.web3RPC.eth.accounts[1]
  console.log('blockVoterAddress:', blockVoterAddress) 
  let isBlockVoter = quorumNetwork.web3RPC.quorum.isBlockVoter(blockVoterAddress)
  console.log('isBlockVoter:', isBlockVoter) 
  cb()
}

exports.AddBlockMaker = addBlockMaker
exports.AddBlockVoter = addBlockVoter
