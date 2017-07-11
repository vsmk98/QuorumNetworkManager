#!/bin/bash
set -u
set -e

geth --datadir Blockchain init quorum-genesis.json &>> /dev/null
sleep 5

GLOBAL_ARGS="--raft --shh --rpc --rpcaddr 0.0.0.0 --rpcapi admin,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum"

nohup constellation-node constellation.config &> constellation.log &
sleep 5

PRIVATE_CONFIG=constellation.config nohup geth --datadir Blockchain $GLOBAL_ARGS --rpcport $1 --port $2 --unlock 0 --password passwords.txt  &> gethNode.log &
sleep 10

echo "[*] Node started"
