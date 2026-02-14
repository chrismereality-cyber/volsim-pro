import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'ledger.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Fetch real BTC price from Binance (Public API - No Key Needed)
    const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    const priceData = await priceRes.json();
    const currentPrice = parseFloat(priceData.price);

    // Calculate Gain/Loss based on your $2,616.61 entry price
    const entryPrice = data.market_price || 2616.61;
    const priceChangeRatio = (currentPrice - entryPrice) / entryPrice;
    
    // 125x Leverage Simulation
    const leverage = 125;
    const equityFluctuation = data.base_equity * (priceChangeRatio * leverage);
    
    // Update live equity (Apex balance + fluctuation)
    const liveTotalEquity = 15000000.00 + equityFluctuation;

    return NextResponse.json({
      ...data,
      "market_price": currentPrice,
      "total_equity": liveTotalEquity,
      "last_tick": new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ "total_equity": 15000000, "error": "ORACLE_OFFLINE" });
  }
}