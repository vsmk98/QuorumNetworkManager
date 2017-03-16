var async = require('async');
var util = require('./util.js');

function startSubmittingTransactions(){
  var seqFunction = async.seq(
    util.CreateWeb3Connection,
    util.GetNewGethAccount
  );
  var result = {
    "web3IPCHost": './Blockchain/geth.ipc',
    "web3RPCProvider": 'http://localhost:20010',
  };
  seqFunction(result, function(err, res){
    if (err) { console.log('ERROR:', err); }
    var web3IPC = res.web3IPC;
    var web3RPC = res.web3RPC;

    var account1 = res.addressList[0];

    setInterval(function(){
      var tx = {
        from: web3RPC.eth.accounts[0],
        to: account1,
        value: 1
      };
      web3RPC.eth.sendTransaction(tx, function(err, res){
        if (err) { console.log('Send transaction ERROR:', err); }
      });
    }, 500);
  });
}

startSubmittingTransactions();
