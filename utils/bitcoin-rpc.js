const axios = require('axios');

// Make RPC calls to Bitcoin node
async function makeRpcCallBTC(config, method, params = []) {
    try {
        const response = await axios.post(`http://${config.bitcoin.host}:${config.bitcoin.port}`, {
            jsonrpc: '1.0',
            id: 'fastwithdrawal',
            method,
            params
        }, {
            auth: {
                username: config.bitcoin.user,
                password: config.bitcoin.password
            }
        });
        return response.data.result;
    } catch (error) {
        console.error(`RPC call failed (${method}):`, error.message);
        throw error;
    }
}

module.exports = { makeRpcCallBTC }; 