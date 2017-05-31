This project aims to make creating Quorum networks easy.

# Contents

1. Getting started
2. Performance analysis

# Getting started

## Requirements

1. go 1.7.3/4/5 (this has to do with go-ethereum not working with go 1.8)
2. Ubuntu 16.04 (this has to do with installing Constellation)
3. NodeJS v7.10.0+ (tested on v7.10.0) (refer to https://nodejs.org/en/download/package-manager/ for installation)

## Installing Ethereum		
 		
 NOTE1: There seems to be a problem with web3 if we don't install ethereum, we still need to find the exact package
 web3 is missing and simply install that package instead.
  		
 1. `sudo apt-get install software-properties-common`		
 2. `sudo add-apt-repository -y ppa:ethereum/ethereum`		
 3. `sudo apt-get update`		
 4. `sudo apt-get install ethereum`

## Installing Quorum

NOTE1: We will need to use Quorum's geth, so do a `sudo mv /usr/bin/geth /usr/bin/normalGeth`

Installation guide for https://github.com/jpmorganchase/quorum

NOTE: This should replace your currently installed `geth`. 

1. `sudo apt-get install -y build-essential`
2. `git clone https://github.com/jpmorganchase/quorum.git`
3. `cd quorum`
4. `make all`
5. Add /build/bin to your PATH: `echo "PATH=\$PATH:"$PWD/build/bin >> ~/.bashrc`
6. `source ~/.bashrc`

## Installing Constellation

Installation guide for https://github.com/jpmorganchase/constellation

1. `sudo apt-get install libdb-dev libsodium-dev zlib1g-dev libtinfo-dev unzip`
2. `mkdir constellation`
3. `cd constellation`
4. `wget https://github.com/jpmorganchase/constellation/releases/download/v0.0.1-alpha/ubuntu1604.zip`
5. `unzip ubuntu1604.zip`
6. `chmod +x ubuntu1604/constellation-node`
7. `chmod +x ubuntu1604/constellation-enclave-keygen`
8. Add ubuntu1604 to your PATH: `echo "PATH=\$PATH:"$PWD/ubuntu1604 >> ~/.bashrc`
9. `source ~/.bashrc`

## Installing Quorum Genesis

Installation guide for https://github.com/davebryson/quorum-genesis

NOTE: the public-key (use ssh-keygen to generate one) of the machine you are working on will have to be added to your github account to clone this repo via ssh

1. `git clone git@github.com:davebryson/quorum-genesis.git`
2. `cd quorum-genesis`
3. `sudo npm install -g`

## Installing the QuorumNetworkManager

1. `git clone git@github.com:coeniebeyers/QuorumNetworkManager.git`
2. `cd QuorumNetworkManager`
3. `npm install`

# Performance analysis

For the purpose of this project, several tools have been added to assist in determining whether certain use cases are appropriate w.r.t necessary performance.

To properly understand the below metrics, users should familiarise themselves with `gas` and `gas limit` and what exactly they represent.   

## Main script (index.js)

Running the main `index.js` script has an option to display the network usage by means of:
1. transactions per second (tx/s),
2. gas usage per second,
3. maximum gas per second

### Transactions per second

This is a simple measurement of how many transaction occurred over an intervals, divided by that interval. E.g. for 60 transactions that occurred over 10 seconds, we have 60 transactions/10 seconds to give us 6 transactions per seconds.

### Gas usage per seconds

This takes the total gas used over a interval divided over that interval. E.g. For 10000 gas used over 10 seconds, we have 10000 gas/10 seconds to give us 1000 gas usage per second

### Maximum gas per second

This takes the gaslimit of each block that was processed 

## doTransactions.js

This script will perform basic ether transfers between two accounts to aid in gauging transactional throughput. To run this script you will need to:
1. have two accounts, `eth.accounts[0]` and `eth.accounts[1]`,
2. `eth.accounts[0]` should be unlocked,
3. `eth.accounts[0]` should have some ether in it. Using the doTransactions.js script in conjunction with the index.js script should already take care of filing accounts with some ether.
4. in the doTransactions.js script there is a timeout that controls how frequently transactions are submitted. Adjust this number based on your needs. A lower number equals lower/less time between transactions which means more transactions per second.

This script will output if a transaction does not make it into the blockchain. If this happens, increase the number spoken of in number 4 above.




