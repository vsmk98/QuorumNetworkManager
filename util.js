var exec = require('child_process').exec;

function killallGethConstellationNode(cb){
  var cmd = 'killall -9';
  cmd += ' geth';
  cmd += ' constellation-node';
  var child = exec(cmd, function(){
    cb(null, null);
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

function clearDirectories(result, cb){
  var cmd = 'rm -rf';
  for(var i in result.folders){
    var folder = result.folders[i];
    cmd += ' '+folder;    
  }
  var child = exec(cmd, function(){
    cb(null, result);
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

function createDirectories(result, cb){
  var cmd = 'mkdir';
  for(var i in result.folders){
    var folder = result.folders[i];
    cmd += ' '+folder;    
  }
  var child = exec(cmd, function(){
    cb(null, result);
  });
  child.stderr.on('data', function(error){
    console.log('ERROR:', error);
    cb(error, null);
  });
}

function hex2a(hexx) {
  var hex = hexx.toString();//force conversion
  var str = '';
  for (var i = 0; i < hex.length; i += 2){
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

function createWeb3Connection(result, cb){
  // Web3 IPC
  var host = result.web3IPCHost;
  var Web3IPC = require('web3_ipc');
  var options = {
    host: host,
    ipc: true,
    personal: true,
    admin: true,
    debug: false
  };
  var web3IPC = Web3IPC.create(options);
  result.web3IPC = web3IPC;
  // Web3 RPC
  var httpProvider = result.web3RPCProvider;
  var Web3RPC = require('web3');
  var web3RPC = new Web3RPC();
  web3RPC.setProvider(new web3RPC.providers.HttpProvider(httpProvider));
  result.web3RPC = web3RPC;
  cb(null, result);
}

function connectToPeer(result, cb){
  var enode = result.enode;
  result.web3IPC.admin.addPeer(enode, function(err, res){
    if(err){console.log('ERROR:', err);}
    cb(null, result);
  });
}

exports.Hex2a = hex2a;
exports.ClearDirectories = clearDirectories;
exports.CreateDirectories = createDirectories;
exports.CreateWeb3Connection = createWeb3Connection;
exports.ConnectToPeer = connectToPeer;
exports.KillallGethConstellationNode = killallGethConstellationNode;
