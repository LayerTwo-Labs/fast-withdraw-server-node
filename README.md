# Fast Withdraw Server

A Node.js server that facilitates fast withdrawals from Layer 2 chains (Thunder, BitNames) to Bitcoin mainchain.

## Features

- Support for all Layer 2 chains:
  - Thunder
  - BitNames
- New L1 and L2 addresses for every request
- L2 Payment verification
- Configurable server fee

## Prerequisites

- Node.js
- Bitcoin node running (for L1 operations)
- Enforcer running (So that L2s can run)
- Thunder node running (for L2 operations)
- Thunder CLI installed
- BitNames node running (for L2 operations)
- BitNames CLI installed

## Configuration

The server can be configured through environment variables or by modifying the default values in `config.js`.

### Bitcoin Core Configuration

Configure the Bitcoin Core RPC connection:

```
BITCOIN_RPC_HOST=127.0.0.1     # Bitcoin Core RPC host
BITCOIN_RPC_PORT=38332         # Bitcoin Core RPC port
BITCOIN_RPC_USER=user          # Bitcoin Core RPC username
BITCOIN_RPC_PASS=password      # Bitcoin Core RPC password
```

### Layer 2 Configuration

Configure Layer 2 CLI paths and RPC connections:

```
# Thunder Configuration
THUNDER_CLI_PATH=/path/to/thunder-cli     # Path to Thunder CLI executable
THUNDER_RPC_ADDR=127.0.0.1:42011   # Thunder RPC address

# BitNames Configuration
BITNAMES_CLI_PATH=/path/to/bitnames-cli   # Path to BitNames CLI executable
```

Default paths in `config.js` are:
- Thunder CLI: `~/Downloads/thunder-cli`
- BitNames CLI: `~/Downloads/bitnames-cli`

The server will verify that these executables exist and are accessible before starting.

### Server Configuration

Other server settings:

```
PORT=3333    # Server port (optional, defaults to 3333)
```

## Starting the Server

1. Ensure Bitcoin Core is running and accessible
2. Verify Thunder and BitNames CLI tools are installed and executable
3. Set environment variables or update config.js as needed
4. Run the server:

```
node index.js
```

The server will verify all CLI tools are accessible before starting. If any tools are missing or not executable, it will exit with an error message.

## API Reference

The server will run on port 3333 by default.

### Create Withdrawal Request

Creates a new withdrawal request from L2 to Bitcoin mainchain.

```bash
POST /withdraw
```

#### Request Body
```json
{
  "withdrawal_destination": "string",  // Bitcoin address
  "withdrawal_amount": "string",       // Amount in BTC
  "layer_2_chain_name": "string"      // "Thunder" or "BitNames"
}
```

#### Example Request
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "withdrawal_destination": "tb1qld9rw7vkpjtwyq5sttsn6npmqrgwtazfky5nj0",
    "withdrawal_amount": "1",
    "layer_2_chain_name": "Thunder"
  }' \
  http://localhost:3333/withdraw
```

#### Example Response
```json
{
  "status": "success",
  "message": "Withdrawal request received and stored",
  "data": {
    "withdrawal_destination": "tb1qld9rw7vkpjtwyq5sttsn6npmqrgwtazfky5nj0",
    "withdrawal_amount": 1,
    "layer_2_chain_name": "Thunder",
    "server_l1_address": {
      "info": "tb1qyaw066jaunmemg6l3tsuq85550836cueefhsmu"
    },
    "server_l2_address": {
      "info": "2S8G1qwtDPKL1ghbhLHaqUHuh15E"
    },
    "server_fee_sats": 1000,
    "timestamp": "2025-01-29T00:37:06.537Z",
    "hash": "c05f10079f9b4861aac0257cdd98b491463cd219d74e77e12efb78472d779b31"
  }
}
```

### Complete Withdrawal

After paying to the server's L2 address (amount + server_fee_sats), submit the L2 payment transaction ID to complete the withdrawal.

```bash
POST /paid
```

#### Request Body
```json
{
  "hash": "string",  // Withdrawal request hash
  "txid": "string"   // L2 payment transaction ID
}
```

#### Example Request
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "hash": "c05f10079f9b4861aac0257cdd98b491463cd219d74e77e12efb78472d779b31",
    "txid": "f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e98316"
  }' \
  http://localhost:3333/paid
```

#### Example Response
```json
{
  "status": "success",
  "message": {
    "info": "2249db807d72b2ff2c7974d08d841fc273f23c0b2ffbf568998e62fdbf314f4d"
  },
  "data": {
    "withdrawal_destination": "tb1qld9rw7vkpjtwyq5sttsn6npmqrgwtazfky5nj0",
    "withdrawal_amount": 1,
    "layer_2_chain_name": "Thunder",
    "server_l1_address": {
      "info": "tb1qyaw066jaunmemg6l3tsuq85550836cueefhsmu"
    },
    "server_l2_address": {
      "info": "2S8G1qwtDPKL1ghbhLHaqUHuh15E"
    },
    "server_fee_sats": 1000,
    "timestamp": "2025-01-29T00:37:06.537Z",
    "hash": "c05f10079f9b4861aac0257cdd98b491463cd219d74e77e12efb78472d779b31",
    "txid": "f4184fc596403b9d638783cf57adfe4c75c605f6356fbc91338530e98316",
    "paid_at": "2025-01-29T00:42:42.751Z"
  }
}
```
