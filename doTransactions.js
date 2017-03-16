var async = require('async');
var util = require('./util.js');
var count = 0;
var startTime = new Date().getTime();

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
      var txObj = {
        from: web3RPC.eth.accounts[0],
        to: account1,
        value: 1
      };
      web3IPC.eth.sendTransaction(txObj, function(err, txHash){
        if (err) { console.log('Send transaction ERROR:', err); }
        setTimeout(function(){
          web3IPC.eth.getTransaction(txHash, function(err, tx){
            if (err) { console.log('Get transaction ERROR:', err); }
            if(tx == undefined || tx.blockNumber == null){
              console.log('Tx not included in block:', txHash);
            } else {
              count++;
            }
          });          
        }, 3000);
      });
    }, 1000);
  });
}

function run(){
  for(var i = 0; i < 3; i++){
    var timeout = Math.floor(Math.random()*10*1000);
    setTimeout(function(){
      startSubmittingTransactions()
    }, timeout);
  }

  setInterval(function(){
    var elapsedTime = new Date().getTime() - startTime;
    console.log('Confirmed transactions:', count);
    console.log('Confirmed tx/s', (count/(elapsedTime/1000)).toFixed(2)); 
  }, 10*1000);
}


run();
