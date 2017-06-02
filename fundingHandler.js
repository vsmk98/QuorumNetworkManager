let whisper = require('./whisperNetwork.js')

let processedAccounts = []

function accountDiff(arrayA, arrayB){
  let arrayC = []
  for(let i in arrayA){
    let itemA = arrayA[i]
    let found = false
    for(let j in arrayB){
      let itemB = arrayB[j]
      if(itemA === itemB){
        found = true
      }
    }
    if(found === false){
      arrayC.push(itemA)
    }
  }
  return arrayC
}

function getAllBalancesForThisNode(result, cb){
  let thresholdBalance = 0.1

  let commWeb3RPC = result.communicationNetwork.web3RPC
  let web3RPC = result.web3RPC
  let accounts = accountDiff(web3RPC.eth.accounts, processedAccounts)

  for(let i in accounts){
    let account = accounts[i]
    let balance = web3RPC.fromWei(web3RPC.eth.getBalance(account).toString(), 'ether')
    // if balance is below threshold, request topup
    if(balance < thresholdBalance){
      whisper.RequestSomeEther(commWeb3RPC, account, function(){
        processedAccounts.push(account)
      })
    }    
  }
}

function monitorAccountBalances(result, cb){
  let web3RPC = result.web3RPC
  setInterval(function(){
    getAllBalancesForThisNode(result, function(){ }) 
  }, 5*1000)
  cb(null, result)
}

exports.MonitorAccountBalances = monitorAccountBalances
