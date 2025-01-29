#!/bin/bash

# START BITCOIND TODO
#
# Start enforcer
./enforcer --node-rpc-addr=localhost:38332 --node-rpc-user=user --node-rpc-pass=password --node-zmq-addr-sequence=tcp://localhost:29000 --enable-wallet
