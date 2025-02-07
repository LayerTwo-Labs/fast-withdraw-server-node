const { exec } = require('child_process');
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const { config, verifyConfig } = require('./config');
const { makeRpcCallBTC } = require('./utils/bitcoin-rpc');
const { execThunderCli } = require('./utils/thunder-cli');
const app = express();

const SERVER_FEE_SATS = 1000

// Bitcoin-patched RPC interaction

// RPC to get Bitcoin balance
async function getBalanceBTC() {
    try {
        const info = await makeRpcCallBTC(config, 'getbalance');
        console.debug("getbalance response: ", info);
        return {
            info
        };
    } catch (error) {
        console.error('Failed to get BTC balance:', error);
        throw error;
    }
}

// RPC to get Bitcoin address
async function getAddressBTC() {
    try {
        const info = await makeRpcCallBTC(config, 'getnewaddress');
        console.debug("getnewaddress response: ", info);
        return {
            info
        };
    } catch (error) {
        console.error('Failed to get BTC address:', error);
        throw error;
    }
}

// RPC to send coins to Bitcoin address
async function sendToAddressBTC(address, amount) {
    try {
        const info = await makeRpcCallBTC(config, 'sendtoaddress', [address, amount]);
        console.debug("sendtoaddress response: ", info);
        return {
            info
        };
    } catch (error) {
        console.error('Failed to send to BTC address:', error);
        throw error;
    }
}




// Thunder interaction

async function getAddressThunder() {
    try {
        console.log("Getting Thunder address via CLI");
        const info = await execThunderCli(config, 'get-new-address');
        return { info };
    } catch (error) {
        console.error('Failed to get Thunder address:', error);
        throw error;
    }
}

async function verifyThunderPayment(txid, address, amount) {
    try {
        // TODO
        return true;
    } catch (error) {
        console.error('Payment could not be verified', error);
        throw error;
    }
}




// BitNames interaction

async function getAddressBitNames() {
    try {
        console.log("Getting BitNames address via CLI");
        return new Promise((resolve, reject) => {
            exec(`${config.bitnames.cliPath} get-new-address`, (error, stdout, stderr) => {
                if (error) {
                    console.error('Failed to get BitNames address:', error);
                    reject(error);
                    return;
                }
                if (stderr) {
                    console.error('BitNames CLI stderr:', stderr);
                }
                console.debug("BitNames CLI response:", stdout);
                resolve({ info: stdout.trim() });
            });
        });
    } catch (error) {
        console.error('Failed to get BitNames address:', error);
        throw error;
    }
}

async function verifyBitNamesPayment(txid, address, amount) {
    try {
        // TODO
        return true;
    } catch (error) {
        console.error('Payment could not be verified', error);
        throw error;
    }
}




// The server

// Store withdrawal requests
const withdrawalRequests = [];

// Middleware for parsing JSON bodies
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Get BTC balance endpoint
app.get('/balance', async (req, res) => {
    try {
        const balance = await getBalanceBTC();
        res.json({
            status: 'success',
            data: balance
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to get balance',
            error: error.message
        });
    }
});

// Handle withdrawal requests
app.post('/withdraw', async (req, res) => {
    const { withdrawal_destination, withdrawal_amount, layer_2_chain_name } = req.body;
    
    // Validate required fields
    if (!withdrawal_destination || !withdrawal_amount || !layer_2_chain_name) {
        return res.status(400).json({ 
            error: 'withdrawal_destination, withdrawal_amount, and layer_2_chain_name are required' 
        });
    }

    // Validate mainchain destination and layer2 name are strings
    if (typeof withdrawal_destination !== 'string' || 
        typeof layer_2_chain_name !== 'string') {
        return res.status(400).json({ 
            error: 'withdrawal_destination and layer_2_chain_name must be strings' 
        });
    }

    // Validate withdrawal_amount is an integer
    const amount = parseInt(withdrawal_amount);
    if (isNaN(amount) || amount.toString() !== withdrawal_amount) {
        return res.status(400).json({
            error: 'withdrawal_amount must be an integer'
        });
    }

    // TODO validate address format
    // TODO validate amount format

    // Check L2 chain name
    if (layer_2_chain_name != "Thunder" && layer_2_chain_name != "BitNames") {
        return res.status(400).json({ 
            error: 'Invalid Layer 2 name' 
        });
    }

    // Generate a new L2 address for this payment
    var server_l2_address = "";
    if (layer_2_chain_name == "Thunder") {
        server_l2_address = await getAddressThunder();
    } 
    else
    if (layer_2_chain_name == "BitNames") {
        server_l2_address = await getAddressBitNames();
    }

    if (server_l2_address == "") {
        return res.status(400).json({ 
            error: 'Failed to generate L2 address' 
        });
    }
    
    // Generate a new bitcoin address for this request
    const server_l1_address = await getAddressBTC();

    // Create withdrawal request
    const withdrawalRequest = {
        withdrawal_destination,
        withdrawal_amount: amount,
        layer_2_chain_name,
        server_l1_address,
        server_l2_address,
        server_fee_sats: SERVER_FEE_SATS,
        timestamp: new Date().toISOString()
    };
    
    // Create hash of the request
    const requestHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(withdrawalRequest))
        .digest('hex');
    
    // Add hash to request object
    withdrawalRequest.hash = requestHash;
    
    // Track new withdrawal request
    withdrawalRequests.push(withdrawalRequest);

    res.json({
        status: 'success',
        message: 'Withdrawal request received and stored',
        data: withdrawalRequest,
    });
});

// Handle paid notifications
app.post('/paid', async (req, res) => {
    const { hash, txid } = req.body;

    // Validate required fields
    if (!hash || !txid) {
        return res.status(400).json({
            error: 'Both hash and txid are required'
        });
    }

    // Validate types
    if (typeof hash !== 'string' || typeof txid !== 'string') {
        return res.status(400).json({
            error: 'Both hash and txid must be strings'
        });
    }

    // Find the withdrawal request with matching hash
    const request = withdrawalRequests.find(req => req.hash === hash);
    if (!request) {
        return res.status(404).json({
            error: 'No withdrawal request found with the provided hash'
        });
    }

    // Verify L2 payment
    if (request.layer_2_chain_name == "Thunder") {
        if (!verifyThunderPayment(txid, request.server_l2_address, request.amount)) {
            res.json({
                status: 'error',
                message: "Payment not verified",
                data: request
            }); 
        }
    }
    else
    if (request.layer_2_chain_name == "BitNames") {
        if (!verifyBitNamesPayment(txid, request.server_l2_address, request.amount)) {
            res.json({
                status: 'error',
                message: "Payment not verified",
                data: request
            }); 
        }
    } 
    else {
        res.json({
            status: 'error',
            message: "Invalid L2 chain name",
            data: request
        });
    }

    // Update the request with txid of L2 payment and paid timestamp
    request.txid = txid;
    request.paid_at = new Date().toISOString();

    // Send BTC to requester and complete the invoice
    const payout_txid = await sendToAddressBTC(request.withdrawal_destination, request.withdrawal_amount);

    res.json({
        status: 'success',
        message: payout_txid,
        data: request
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Verify CLI tools before starting server
async function startServer() {
    try {
        await verifyConfig(config);
        
        // Start server
        const PORT = process.env.PORT || 3333;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

// Replace the existing server start code at the bottom with:
startServer();
