import notifier from 'node-notifier';
import { exec } from 'child_process';
import path from 'path';

const BUY_ZONE = 4950.00;
const CHECK_INTERVAL = 30000;

async function checkDip() {
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd');
        const data = await res.json();
        const price = data['pax-gold'].usd;

        console.clear();
        console.log(`[${new Date().toLocaleTimeString()}] Monitoring for Dip...`);
        console.log(`Current Price: $${price.toFixed(2)} | Target Dip: $${BUY_ZONE.toFixed(2)}`);

        if (price <= BUY_ZONE) {
            // 1. Desktop Notification
            notifier.notify({
                title: '?? GOLD DIP DETECTED!',
                message: `Gold has hit $${price.toFixed(2)}. Time to secure your 2026 Maple Leaf.`,
                sound: true,
                wait: true
            });

            // 2. Audible System Beep
            exec('powershell.exe [console]::beep(800, 1000)');
            
            console.log("\n?? TARGET REACHED. ALERT SENT TO DESKTOP.");
        }
    } catch (err) {
        console.log("?? Connection Lagging...");
    }
}

console.log("Maple-Shield: Mobile-Synced Alert Active.");
setInterval(checkDip, CHECK_INTERVAL);
checkDip();
