#!/bin/bash
set -u
set -e

#echo "[*] Initialising genesis block"
geth --datadir Blockchain init quorum-genesis.json &>> /dev/null
geth --datadir Blockchain2 init quorum-genesis.json &>> /dev/null
sleep 5

NETID=91351
BOOTNODE_KEYHEX=77bd02ffa26e3fb8f324bda24ae588066f1873d95680104de5bc2db9e7b2e510
BOOTNODE_ENODE=enode://6433e8fb82c4638a8a6d499d40eb7d8158883219600bfd49acb968e3a37ccced04c964fa87b3a78a2da1b71dc1b90275f4d055720bb67fad4a118a56925125dc@[192.168.88.238]:33445

GLOBAL_ARGS="--bootnodes $BOOTNODE_ENODE --networkid $NETID --rpc --rpcaddr 0.0.0.0 --rpcapi admin,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum"

#echo "[*] Starting Constellation node"
nohup constellation-node constellation2.config &> constellation2.log &
sleep 5
nohup constellation-node constellation.config &> constellation.log &

#echo "[*] Starting bootnode"
nohup bootnode --nodekeyhex "$BOOTNODE_KEYHEX" --addr="192.168.88.238:33445" &> bootnode.log &
#echo "wait for bootnode to start..."
sleep 6

#echo "[*] Starting node"
PRIVATE_CONFIG=constellation2.config nohup geth --datadir Blockchain2 $GLOBAL_ARGS --rpcport 20011 --port 20001 --voteaccount $3 --votepassword "" --minblocktime 2 --maxblocktime 5 &>gethNode2.log &
sleep 5

PRIVATE_CONFIG=constellation.config nohup geth --datadir Blockchain $GLOBAL_ARGS --rpcport 20010 --port 20000 --voteaccount $1 --votepassword "" --blockmakeraccount $2 --blockmakerpassword "" --singleblockmaker --minblocktime 2 --maxblocktime 5 &>gethNode1.log &
sleep 5

echo "[*] Node started"
