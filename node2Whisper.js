var Web3 = require('web3');
var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://localhost:40010'));

web3.shh.filter({"topics":["TestTopic"]}).watch(function(err, msg) {
  if(err){console.log("ERROR:", err);};
  var message = hex2a(msg.payload);
  console.log("New message:");
  console.log(message);
});

function hex2a(hexx) {
  var hex = hexx.toString();//force conversion
  var str = '';
  for (var i = 0; i < hex.length; i += 2){
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}
