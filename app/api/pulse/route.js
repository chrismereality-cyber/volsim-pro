import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'ledger.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Fetch real BTC price
    let currentPrice = 96000;
    try {
      const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { cache: 'no-store' });
      const priceData = await priceRes.json();
      currentPrice = parseFloat(priceData.price);
    } catch (e) { console.log("Oracle delay"); }

    // DYNAMIC CALCULATION
    const entryPrice = 96000; 
    const currentLeverage = data.leverage || 125; // This is what you control with buttons
    const priceChangeRatio = (currentPrice - entryPrice) / entryPrice;
    
    // The "Apex" Math: Only fluctuate based on selected leverage
    const baseApex = 27051037840.66;
    const fluctuation = baseApex * (priceChangeRatio * (currentLeverage / 125));
    const liveTotal = baseApex + fluctuation;

    return new NextResponse(JSON.stringify({
      ...data,
      "market_price": currentPrice,
      "total_equity": liveTotal,
      "leverage_active": currentLeverage
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    return NextResponse.json({ "total_equity": 27051037840.66 });
  }
}