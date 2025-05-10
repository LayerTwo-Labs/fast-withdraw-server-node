const { exec } = require('child_process');

async function execBitnamesCli(config, command) {
    const { rpcUrl } = config.bitnames;
    if (!rpcUrl) {
        throw new Error('Bitnames CLI RPC URL is not set');
    }
    
    return new Promise((resolve, reject) => {
        exec(`${config.bitnames.cliPath} --rpc-url=${rpcUrl} ${command}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`BitNames CLI error:`, error);
                reject(error);
                return;
            }
            if (stderr) {
                console.error('BitNames CLI stderr:', stderr);
            }
            resolve(stdout.trim());
        });
    });
}

module.exports = { execBitnamesCli }; 