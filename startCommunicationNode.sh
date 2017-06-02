#!/bin/bash
set -u
set -e

NETID=91351
GLOBAL_ARGS="--networkid $NETID --shh --rpc --rpcaddr 0.0.0.0 --rpcapi admin,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum --nodiscover"

nohup geth --datadir CommunicationNode $GLOBAL_ARGS --rpcport 40010 --port 40000 &> communicationNode.log &
sleep 5

echo "[*] Node started"
