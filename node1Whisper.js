var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:20010'));

var myIdentity = web3.shh.newIdentity();

var str = "This is pretty awesome";
var hexString = new Buffer(str).toString('hex');

web3.shh.post({
  "from": myIdentity,
  "topics": [ "TestTopic"],
  "payload": hexString,
  "ttl": 100,
  "workToProve": 100
}, function(err, res){
  if(err){console.log('err', err);}
  console.log('Message sent:', res);
});

