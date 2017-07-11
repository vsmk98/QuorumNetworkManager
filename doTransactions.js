var async = require('async');
var util = require('./util.js');
var confirmedCount = 0;
var submittedCount = 0;
var failedSubmissions = 0;
var startTime = new Date().getTime();
let ports = require('./config.js').ports

function startSubmittingTransactions(){
  var seqFunction = async.seq(
    util.CreateWeb3Connection
  );
  var result = {
    "web3IPCHost": './Blockchain/geth.ipc',
    "web3RPCProvider": 'http://localhost:'+ports.gethNodeRPC
  };
  seqFunction(result, function(err, res){
    if (err) { console.log('ERROR:', err); }
    var web3IPC = res.web3IPC;
    var web3RPC = res.web3RPC;

    //var account1 = res.addressList[0];

    var txObj = {
      from: web3RPC.eth.accounts[0],
      to: web3RPC.eth.accounts[1],
      value: 0
    };

    setInterval(function(){
      submittedCount++;
      web3IPC.eth.sendTransaction(txObj, function(err, txHash){
        if (err) { console.log('Send transaction ERROR:', err); }
        /*setTimeout(function(){
          web3IPC.eth.getTransaction(txHash, function(err, tx){
            if (err) { console.log('Get transaction ERROR:', err); }
            if(tx == undefined || tx.blockNumber == null){
              console.log('Tx not included in block:', txHash);
              failedSubmissions++;
            } else {
              confirmedCount++;
            }
          });          
        }, 60*1000);*/
      });
    }, 2);
  });
}

function run(){

  startSubmittingTransactions();

  setInterval(function(){
    var elapsedTime = new Date().getTime() - startTime;
    console.log('Confirmed tx/s', (confirmedCount/(elapsedTime/1000)).toFixed(2)); 
    console.log('Submitted tx/s', (submittedCount/(elapsedTime/1000)).toFixed(2)); 
    console.log('Submitted: '+submittedCount+' | Confirmed: '+confirmedCount);
    console.log('Failed submissions:', failedSubmissions);
    console.log('-');
  }, 10*1000);
}


run();
