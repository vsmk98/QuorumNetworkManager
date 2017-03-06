#!/bin/bash
set -u
set -e
PRIVATE_CONFIG=constellation.config
geth --networkid 87234 --rpc --rpcaddr 0.0.0.0 --rpcport 20000 --datadir Blockchain --port 20010 --rpcapi admin,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum --voteaccount $1 --votepassword $2 --minblocktime 1 --maxblocktime 2 --permissioned
