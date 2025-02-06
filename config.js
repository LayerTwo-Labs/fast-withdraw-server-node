const { access, constants } = require('fs/promises');
const path = require('path');

// Default configuration values
const defaultConfig = {
    bitcoin: {
        host: '127.0.0.1',
        port: 38332,
        user: 'user',
        password: 'password'
    },
    thunder: {
        cliPath: '~/Downloads/thunder-cli'
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

// Verify all CLI tools are available
async function verifyConfig(config) {
    const verifications = [
        verifyExecutable(config.thunder.cliPath, 'Thunder'),
        verifyExecutable(config.bitnames.cliPath, 'BitNames')
    ];
    
    try {
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
        cliPath: process.env.THUNDER_CLI_PATH || defaultConfig.thunder.cliPath
    },
    bitnames: {
        cliPath: process.env.BITNAMES_CLI_PATH || defaultConfig.bitnames.cliPath
    }
};

// Export both config and verification function
module.exports = { config, verifyConfig }; 