const { access, constants } = require('fs/promises');
const path = require('path');
const axios = require('axios');
const { makeRpcCallBTC } = require('./utils/bitcoin-rpc');
const { execThunderCli } = require('./utils/thunder-cli');

// Default configuration values
const defaultConfig = {
    bitcoin: {
        host: '127.0.0.1',
        port: 38332,
        user: 'user',
        password: 'password'
    },
    thunder: {
        cliPath: '~/Downloads/thunder-cli',
        rpcAddr: '127.0.0.1:6009'  // Add default Thunder RPC address
    },
    bitnames: {
        cliPath: '~/Downloads/bitnames-cli'
    }
};

// Verify executable exists and is executable
async function verifyExecutable(filePath, name) {
    // Expand ~ to home directory if present
    const expandedPath = filePath.replace(/^~/, process.env.HOME);
    const resolvedPath = path.resolve(expandedPath);
    
    try {
        await access(resolvedPath, constants.X_OK);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`${name} CLI not found at path: ${resolvedPath}`);
        } else if (error.code === 'EACCES') {
            throw new Error(`${name} CLI at ${resolvedPath} is not executable. Please check permissions.`);
        }
        throw new Error(`Error checking ${name} CLI at ${resolvedPath}: ${error.message}`);
    }
}

// Verify Bitcoin Core RPC connection
async function verifyBitcoinRpc(config) {
    try {
        await makeRpcCallBTC(config, 'getbalance');
        return true;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            throw new Error(`Could not connect to Bitcoin Core at ${config.bitcoin.host}:${config.bitcoin.port}`);
        } else if (error.response && error.response.status === 401) {
            throw new Error('Bitcoin Core RPC authentication failed. Check your username and password.');
        }
        throw new Error(`Bitcoin Core RPC verification failed: ${error.message}`);
    }
}

// Verify Thunder node connection
async function verifyThunderConnection(config) {
    try {
        console.log('Verifying Thunder node connection...');
        await execThunderCli(config, 'balance');
        return true;
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            throw new Error(`Could not connect to Thunder node at ${config.thunder.rpcAddr}`);
        }
        throw new Error(`Thunder node verification failed: ${error.message}`);
    }
}

// Verify all CLI tools are available
async function verifyConfig(config) {
    try {
        // First verify Bitcoin Core connection
        console.log('Verifying Bitcoin Core RPC connection...');
        await verifyBitcoinRpc(config);
        console.log('Bitcoin Core RPC connection verified successfully');

        // Then verify Thunder node connection
        await verifyThunderConnection(config);
        console.log('Thunder node connection verified successfully');

        // Then verify CLI tools
        console.log('Verifying CLI tools...');
        const verifications = [
            verifyExecutable(config.thunder.cliPath, 'Thunder'),
            verifyExecutable(config.bitnames.cliPath, 'BitNames')
        ];
        
        await Promise.all(verifications);
        console.log('All CLI tools verified successfully');
    } catch (error) {
        console.error('Configuration Error:', error.message);
        process.exit(1);
    }
}

// Environment variable based configuration
const config = {
    bitcoin: {
        host: process.env.BITCOIN_RPC_HOST || defaultConfig.bitcoin.host,
        port: parseInt(process.env.BITCOIN_RPC_PORT) || defaultConfig.bitcoin.port,
        user: process.env.BITCOIN_RPC_USER || defaultConfig.bitcoin.user,
        password: process.env.BITCOIN_RPC_PASS || defaultConfig.bitcoin.password
    },
    thunder: {
        cliPath: process.env.THUNDER_CLI_PATH || defaultConfig.thunder.cliPath,
        rpcAddr: process.env.THUNDER_RPC_ADDR || defaultConfig.thunder.rpcAddr
    },
    bitnames: {
        cliPath: process.env.BITNAMES_CLI_PATH || defaultConfig.bitnames.cliPath
    }
};

// Export both config and verification function
module.exports = { config, verifyConfig }; 