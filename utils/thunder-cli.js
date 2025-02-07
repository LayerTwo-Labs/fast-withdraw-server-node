const { exec } = require('child_process');

async function execThunderCli(config, command) {
    return new Promise((resolve, reject) => {
        exec(`${config.thunder.cliPath} --rpc-url=${config.thunder.rpcUrl} ${command}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Thunder CLI error:`, error);
                reject(error);
                return;
            }
            if (stderr) {
                console.error('Thunder CLI stderr:', stderr);
            }
            resolve(stdout.trim());
        });
    });
}

module.exports = { execThunderCli }; 