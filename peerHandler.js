let events = require('./eventEmitter.js');

function listenForNewEnodes(result, cb){
  let web3IPC = result.web3IPC
  events.on('newEnode', function(enode){
    console.log('new enode event:', enode)
    web3IPC.admin.addPeer(enode, function(err, res){
      if(err){console.log('ERROR:', err)}
    })
  })
  cb(null, result)
}

exports.ListenForNewEnodes = listenForNewEnodes
