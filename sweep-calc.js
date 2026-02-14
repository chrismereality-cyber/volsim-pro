const MAPLE_RETAIL_PRICE = 5195.00; // 2026 Estimated Retail with Premium
const TRADING_BALANCE = 12450.00; // Replace with your actual balance

function calculateSweep() {
    const coinsAffordable = Math.floor(TRADING_BALANCE / MAPLE_RETAIL_PRICE);
    const remainingUSD = TRADING_BALANCE % MAPLE_RETAIL_PRICE;
    const progressToNext = ((remainingUSD / MAPLE_RETAIL_PRICE) * 100).toFixed(1);

    console.clear();
    console.log("------------------------------------------");
    console.log("   MAPLE-SHIELD WEALTH CONVERSION        ");
    console.log("------------------------------------------");
    console.log(`Current Trading Balance: $${TRADING_BALANCE.toLocaleString()}`);
    console.log(`2026 Maple Leaf Price:   $${MAPLE_RETAIL_PRICE.toLocaleString()}`);
    console.log("------------------------------------------");
    console.log(`? You can currently buy: ${coinsAffordable} oz Gold`);
    console.log(`?? Progress to next coin: ${progressToNext}%`);
    console.log("------------------------------------------");
    
    if (coinsAffordable > 0) {
        console.log(`ACTION: Sweep $${(coinsAffordable * MAPLE_RETAIL_PRICE).toLocaleString()} to cold storage.`);
    } else {
        console.log("ACTION: Continue bot execution to reach 1.0 oz threshold.");
    }
}

calculateSweep();
