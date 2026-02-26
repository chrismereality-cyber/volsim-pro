const TRADING_BALANCE_USD = 12450.00; 
const USD_CAD_RATE = 1.3725; // 2026 Market Rate
const MAPLE_PREMIUM = 0.05;

async function getLiveDashboard() {
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd');
        const data = await res.json();
        const spotUSD = data['pax-gold'].usd;
        const spotCAD = spotUSD * USD_CAD_RATE;
        
        const physicalUSD = spotUSD * (1 + MAPLE_PREMIUM);
        const physicalCAD = spotCAD * (1 + MAPLE_PREMIUM);
        
        const ounces = (TRADING_BALANCE_USD / physicalUSD).toFixed(3);
        const grams = (ounces * 31.1035).toFixed(2);

        console.clear();
        console.log("==========================================");
        console.log("   MAPLE-SHIELD: CROSS-BORDER TRACKER     ");
        console.log(`   ${new Date().toLocaleTimeString()} | 2026 Bull Market `);
        console.log("==========================================");
        console.log(`?? Balance (USD):   $${TRADING_BALANCE_USD.toLocaleString()}`);
        console.log(`?? Balance (CAD):   $${(TRADING_BALANCE_USD * USD_CAD_RATE).toLocaleString()}`);
        console.log("------------------------------------------");
        console.log(`? Spot Gold (USD): $${spotUSD.toLocaleString()}`);
        console.log(`? Spot Gold (CAD): $${spotCAD.toLocaleString()}`);
        console.log("------------------------------------------");
        console.log(`?? TOTAL WEALTH:    ${ounces} oz (${grams}g)`);
        
        const progress = Math.floor((ounces % 1) * 20);
        const bar = "¦".repeat(progress) + "¦".repeat(20 - progress);
        console.log(`Maple Progress:  [${bar}] ${((ounces % 1) * 100).toFixed(1)}%`);
        console.log("==========================================");
        console.log("        (Updating every 30 seconds)       ");

    } catch (err) {
        console.log("?? Market data congested. Retrying...");
    }
}

getLiveDashboard();
setInterval(getLiveDashboard, 30000);
