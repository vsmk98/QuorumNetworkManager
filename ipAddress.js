let ip = require('whatismyip')

let options = {
  url: 'http://checkip.dyndns.org/',
  truncate: '',
  timeout: 60000,
  matchIndex: 0
}

function whatIsMyIp(cb){
  ip.whatismyip(options, function(err, data){
    if(err){console.log('ERROR:', err)}
    let ipAddresses = {
      publicIp: data.ip,
    }
    cb(ipAddresses)
  })
}

exports.WhatIsMyIp = whatIsMyIp
