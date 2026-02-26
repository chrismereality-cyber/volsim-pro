import { exec } from 'child_process';
console.log("Starting Permanent Static Tunnel...");

// This uses your specific assigned domain
const tunnel = exec('ngrok http --domain=winford-spliceable-uncontinuously.ngrok-free.dev 3000');

tunnel.stdout.on('data', (data) => {
    if (data.includes("url=")) {
        console.log("Global Access Live at: https://winford-spliceable-uncontinuously.ngrok-free.dev");
    }
    console.log(data);
});
tunnel.stderr.on('data', (data) => console.error(data));

setInterval(() => {}, 1000);
