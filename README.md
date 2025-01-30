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
- Thunder CLI installed at `~/Downloads/thunder-cli`
- BitNames node running (for L2 operations)
- BitNames CLI installed at `~/Downloads/bitnames-cli`


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
