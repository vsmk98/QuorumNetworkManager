This project aims to make creating Quorum networks easy.

# Getting started

## Requirements

1. go 1.7.3 (this has to do with go-ethereum not working with go 1.8)
2. Ubuntu 16.04 (this has to do with Constellation)
3. NodeJS

## Installing Quorum

Installation quide for https://github.com/jpmorganchase/quorum

1. `git clone https://github.com/jpmorganchase/quorum.git`
2. `cd quorum`
3. `make all`
4. Add /build/bin to your PATH: `echo "PATH=\$PATH:"$PWD/build/bin >> ~/.bashrc`

## Installing Constellation

Installation guide for https://github.com/jpmorganchase/constellation

1. sudo apt-get install libdb-dev libsodium-dev zlib1g-dev libtinfo-dev unzip
2. mkdir constellation
3. cd constellation
4. wget https://github.com/jpmorganchase/constellation/releases/download/v0.0.1-alpha/ubuntu1604.zip .
5. unzip ubuntu1604.zip
6. Add ubuntu1604 to your PATH: `echo "PATH=\$PATH:"$PWD/ubuntu1604 >> ~/.bashrc`

## Installing Quorum Genesis

Installation guide for https://github.com/davebryson/quorum-genesis

1. `git clone git@github.com:davebryson/quorum-genesis.git`
2. cd quorum-genesis
3. npm install -g
