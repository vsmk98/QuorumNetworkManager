var web3RPC = null;
var blockList = [];

function setup(result, cb){
  web3RPC = result.web3RPC;
  cb(null, result);
}

function enable(){
  web3RPC.eth.filter("latest", function(err, blockHash) { 
    web3RPC.eth.getBlock(blockHash, function(err, block){
      if(err){console.log('err:', err)}
      if(block){
        blockList.push({
          gasLimit: block.gasLimit,
          gasUsed: block.gasUsed,
          nrOfTransactions: block.transactions.length,
          blockTimeStamp: block.timestamp*1000,
          timestamp: new Date().getTime()
        });
      };
    });
  });
}

function printBlockStatistics(){
  if(blockList.length == 0){
    console.log('No blocks in network!');
    return;
  }

  var blocksInLast10Seconds = {
    gasLimit: 0,
    gasUsed: 0,
    nrOfTransactions: 0,
  };
  var blocksInLast60Seconds = {
    gasLimit: 0,
    gasUsed: 0,
    nrOfTransactions: 0,
  };
  var blocksInLast600Seconds = {
    gasLimit: 0,
    gasUsed: 0,
    nrOfTransactions: 0,
  };
  var blocks = {
    gasLimit: 0,
    gasUsed: 0,
    nrOfTransactions: 0,
  };
  var currentTime = new Date().getTime();
  var oldestBlockTime = blockList[0].blockTimeStamp;
  var recordingBlocksFor = currentTime - oldestBlockTime;
  for(var i in blockList){
    var blockData = blockList[i];
    var elapsedTime = currentTime - blockData.blockTimeStamp;
    if(recordingBlocksFor >= 10*1000 && elapsedTime < 10*1000){
      blocksInLast10Seconds.gasLimit += blockData.gasLimit;
      blocksInLast10Seconds.gasUsed += blockData.gasUsed;
      blocksInLast10Seconds.nrOfTransactions += blockData.nrOfTransactions;
    } 
    if(recordingBlocksFor >= 60*1000 && elapsedTime < 60*1000){
      blocksInLast60Seconds.gasLimit += blockData.gasLimit;
      blocksInLast60Seconds.gasUsed += blockData.gasUsed;
      blocksInLast60Seconds.nrOfTransactions += blockData.nrOfTransactions;
    } 
    if(recordingBlocksFor >= 600*1000 && elapsedTime < 600*1000){
      blocksInLast600Seconds.gasLimit += blockData.gasLimit;
      blocksInLast600Seconds.gasUsed += blockData.gasUsed;
      blocksInLast600Seconds.nrOfTransactions += blockData.nrOfTransactions;
    } 
    blocks.gasLimit += blockData.gasLimit;
    blocks.gasUsed += blockData.gasUsed;
    blocks.nrOfTransactions += blockData.nrOfTransactions;
    // TODO: add check that will remove blockData from blockList that is older than 600 seconds
  }
  if(recordingBlocksFor >= 10*1000){
    console.log('--- Stats for last 10 seconds ---'); 
    console.log('Tx/s:', (blocksInLast10Seconds.nrOfTransactions/10).toFixed(2));
    console.log('gasUsed/s:', (blocksInLast10Seconds.gasUsed/10).toFixed(2));
    console.log('max gas/s:', (blocksInLast10Seconds.gasLimit/10).toFixed(2));
    console.log('---')
  }
  if(recordingBlocksFor >= 60*1000){
    console.log('--- Stats for last 1 minute ---'); 
    console.log('Tx/s:', (blocksInLast60Seconds.nrOfTransactions/60).toFixed(2));
    console.log('gasUsed/s:', (blocksInLast60Seconds.gasUsed/60).toFixed(2));
    console.log('max gas/s:', (blocksInLast60Seconds.gasLimit/60).toFixed(2));
    console.log('---')
  }
  if(recordingBlocksFor >= 600*1000){
    console.log('--- Stats for last 10 minutes ---'); 
    console.log('Tx/s:', (blocksInLast600Seconds.nrOfTransactions/600).toFixed(2));
    console.log('gasUsed/s:', (blocksInLast600Seconds.gasUsed/600).toFixed(2));
    console.log('max gas/s:', (blocksInLast600Seconds.gasLimit/600).toFixed(2));
    console.log('---')
  }
  var runTime = Number(((currentTime-oldestBlockTime)/1000/60).toFixed(2));
  console.log('--- Stats for last '+ runTime +' minutes ---'); 
  console.log('Total number of Tx:', blocks.nrOfTransactions);
  console.log('Tx/s:', (blocks.nrOfTransactions/runTime/60).toFixed(2));
  console.log('gasUsed/s:', (blocks.gasUsed/runTime/60).toFixed(2));
  console.log('max gas/s:', (blocks.gasLimit/runTime/60).toFixed(2));
  console.log('---')
}

exports.Setup = setup;
exports.PrintBlockStatistics = printBlockStatistics;
exports.Enable = enable;
