#!/bin/bash

### for your local node use:
SUBINDEX=${1};
TRANSFERS="$(/usr/bin/curl -X POST http://127.0.0.1:18082/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_transfers","params":{"in":true, "pending": true, "pool": true, "account_index": 21, "subaddr_indices": ['${SUBINDEX}']}}' -H 'Content-Type: application/json' 2>/dev/null)";
echo "$TRANSFERS";

### for your remote node use:
# IP1=
# PORT1=
# SUBINDEX=${1};
# jsonrpc='{"jsonrpc":"2.0","id":"0","method":"get_transfers","params":{"in":true, "pending": true, "pool": true, "account_index": 21, "subaddr_indices": ['${SUBINDEX}']}}'
# dostuff="/usr/bin/curl -X POST http://127.0.0.1:18082/json_rpc -d '$jsonrpc' -H 'Content-Type: application/json' 2>/dev/null"
# TRANSFERS=$(/usr/bin/ssh -p $PORT1 webroot@$IP1 "$dostuff" && exit)

echo "$TRANSFERS";