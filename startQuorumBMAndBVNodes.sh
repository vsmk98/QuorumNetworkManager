#!/bin/bash
set -u
set -e

#echo "[*] Initialising genesis block"
geth --datadir Blockchain init quorum-genesis.json &>> /dev/null

NETID=91351

GLOBAL_ARGS="--networkid $NETID --shh --rpc --rpcaddr 0.0.0.0 --rpcapi admin,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum"

nohup constellation-node constellation.config &> constellation.log &
sleep 5

PRIVATE_CONFIG=constellation.config nohup geth --datadir Blockchain $GLOBAL_ARGS --rpcport 20010 --port 20000 --voteaccount $1 --votepassword "" --blockmakeraccount $2 --blockmakerpassword "" --singleblockmaker --minblocktime 0 --maxblocktime 1 --preload "pauseBlockMaking.js" &> gethNode.log &
sleep 5

echo "[*] Node started"
