const { exec } = require('child_process');

async function execBitnamesCli(config, command) {
    return new Promise((resolve, reject) => {
        exec(`${config.bitnames.cliPath} --rpc-url=${config.bitnames.rpcUrl} ${command}`, (error, stdout, stderr) => {
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