This project aims to make creating Quorum networks easy.

# Getting started

## Requirements

1. go 1.7.3/4 (this has to do with go-ethereum not working with go 1.8)
2. Ubuntu 16.04 (this has to do with Constellation)
3. NodeJS v4.5+ (tested on v4.8.0)

## Installing Quorum

Installation quide for https://github.com/jpmorganchase/quorum

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

1. `git clone git@github.com:davebryson/quorum-genesis.git`
2. `cd quorum-genesis`
3. `sudo npm install -g`
