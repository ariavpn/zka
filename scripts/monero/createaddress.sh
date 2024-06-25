#!/bin/bash
 
## for your local node use:
ADDRESS="$(/usr/bin/curl -X POST http://127.0.0.1:18082/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"create_address","params":{"account_index": 21}}' -H 'Content-Type: application/json' 2>/dev/null)";
echo "$ADDRESS";

### for your remote node use:
# IP1=
# PORT1=
# jsonrpc='{"jsonrpc":"2.0","id":"0","method":"create_address","params":{"account_index": 21}}'
# dostuff="/usr/bin/curl -s -X POST http://127.0.0.1:18082/json_rpc -d '$jsonrpc' -H 'Content-Type: application/json'"
# ADDRESS=$(/usr/bin/ssh -p $PORT1 webroot@$IP1 "$dostuff" && exit)
# echo "$ADDRESS"