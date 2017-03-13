console.log('-------------loaded pause Blockmaker script');

function checkWork() {
  var functionName = 'vote(uint256,bytes32)';
  var sha3FunctionName = web3.sha3(functionName).substring(0, 8);
  if (((eth.pendingTransactions.length == 1 || txpool.status.pending == 1)
      && eth.pendingTransactions[0].input.indexOf(sha3FunctionName) < 0)
      || (eth.pendingTransactions.length > 1 || txpool.status.pending > 1)) {
    if(quorum.nodeInfo.blockmakestrategy.status == 'active'){
      return;
    } else {
      quorum.resumeBlockMaker(function(err, res){
        if(err){console.log('ERROR:', err)}
      });
    }
  } else {
    quorum.pauseBlockMaker(function(err, res){
      if(err){console.log('ERROR:', err);}
    });
  }

}

eth.filter("latest", function(err, block) { checkWork(); });
eth.filter("pending", function(err, block) { checkWork(); });

checkWork();
