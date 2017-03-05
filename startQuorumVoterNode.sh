#!/bin/bash
set -u
set -e
PRIVATE_CONFIG=constellation.config
geth --identity $1 --rpc --rpcport "20000" --rpccorsdomain "localhost" --datadir Blockchain --port 20010 --ipcapi "admin,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum" --rpcapi "db,eth,net,web3,admin,personal,quorum" --nat "any" --voteaccount $2 --votepassword $3 --minblocktime 1 --maxblocktime 2 --permissioned

