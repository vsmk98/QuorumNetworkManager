const util = require('./util.js')
var config = require('./config.js')


// TODO: Add to and from fields to validate origins
function requestNetworkMembership(result, cb){

  console.log('[*] Requesting network membership. This will block until the other node responds')
  
  let shh = result.communicationNetwork.web3RPC.shh;
  let id = shh.newIdentity();
  
  let request = "request|networkMembership";
  request += '|'+result.addressList[0] 
  request += '|'+result.enodeList[0]
  request += '|'+config.identity.nodeName
  let hexString = new Buffer(request).toString('hex');

  let receivedNetworkMembership = false
  let intervalID = setInterval(function(){
    if(receivedNetworkMembership){
      clearInterval(intervalID)
    } else {
      shh.post({
        "from": id,
        "topics": ["NetworkMembership"],
        "payload": hexString,
        "ttl": 10,
        "workToProve": 1
      }, function(err, res){
        if(err){console.log('err', err)}
      })
    }
  }, 5000)

  let filter = shh.filter({"topics":["NetworkMembership"]}).watch(function(err, msg) {
    if(err){console.log("ERROR:", err)}
    let message = null
    if(msg && msg.payload){
      message = util.Hex2a(msg.payload)
    }
    if(message && message.indexOf('response|networkMembership') >= 0){
      receivedNetworkMembership = true
      let messageTokens = message.split('|')
      console.log('[*] Network membership:', messageTokens[2])
      cb(null, result)
    }
  })
}

function addToAddressList(result, address){
  if(result.addressList){
    result.addressList.push(address)
  } else {
    result.addressList = [address]
  }
}

function addToEnodeList(result, enode){
  if(result.enodeList){
    result.enodeList.push(enode)
  } else {
    result.enodeList = [enode]  
  }
}

function allowAllNetworkMembershipRequests(result, msg, payload){

  let web3RPC = result.web3RPC;
  let payloadTokens = payload.split('|')
  addToAddressList(result, payloadTokens[1])
  addToEnodeList(result, payloadTokens[2])
  let peerName = payloadTokens[3]
  console.log(peerName + ' has joined the network')

  let from = msg.from // TODO: This needs to be added into a DB.

  let responseString = 'response|networkMembership|ACCEPTED';
  let hexString = new Buffer(responseString).toString('hex');        
  web3RPC.shh.post({
    "topics": ["NetworkMembership"],
    "payload": hexString,
    "ttl": 10,
    "workToProve": 1,
    "to": from
  }, function(err, res){
    if(err){console.log('err', err);}
  });
}

function networkMembershipRequestHandler(result, cb){
  let request = 'request|networkMembership'

  let web3RPC = result.web3RPC;
  web3RPC.shh.filter({"topics":["NetworkMembership"]}).watch(function(err, msg) {
    if(err){console.log("ERROR:", err);};
    let message = null;
    if(msg && msg.payload){
      message = util.Hex2a(msg.payload);
    } 
    if(message && message.indexOf(request) >= 0){
      if(result.networkMembership == 'allowAll'){
        allowAllNetworkMembershipRequests(result, msg, message.replace(request, ''))
      } else if(result.networkMembership == 'allowOnlyPreAuth') {
        // TODO
      }
    }
  });
  cb(null, result);
}

exports.RequestNetworkMembership = requestNetworkMembership
exports.NetworkMembershipRequestHandler = networkMembershipRequestHandler
