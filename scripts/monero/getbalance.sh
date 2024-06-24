#!/bin/bash

### for your local node use:
# ADDINDEX=${1}
# GETBALANCE="$(/usr/bin/curl -X POST http://127.0.0.1:18082/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_balance","params":{"account_index": 21, "address_indices": ['${ADDINDEX}','${ADDINDEX}']}}' -H 'Content-Type: application/json' 2>/dev/null)";
# echo "$GETBALANCE";

### for your remote node use:
IP1="148.251.136.43"
PORT1="22432"
ADDINDEX=${1}
jsonrpc='{"jsonrpc":"2.0","id":"0","method":"get_balance","params":{"account_index": 21, "address_indices": ['${ADDINDEX}','${ADDINDEX}']}}'
dostuff="/usr/bin/curl -s -X POST http://127.0.0.1:18082/json_rpc -d '$jsonrpc' -H 'Content-Type: application/json' 2>/dev/null"
GETBALANCE=$(/usr/bin/ssh -p $PORT1 webroot@$IP1 "$dostuff" && exit)

echo "$GETBALANCE";