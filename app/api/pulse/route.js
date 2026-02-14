import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// FORCE DYNAMIC: This prevents Next.js from caching the $15M static value
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'ledger.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Fetch real BTC price
    const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
        cache: 'no-store' 
    });
    const priceData = await priceRes.json();
    const currentPrice = parseFloat(priceData.price);

    // Entry price at the time of the $15M reach
    const entryPrice = 96000; // Adjusted for current BTC levels
    const priceChangeRatio = (currentPrice - entryPrice) / entryPrice;
    
    // 125x Leverage Simulation
    const leverage = 125;
    const pnl = data.base_equity * (priceChangeRatio * leverage);
    const liveTotalEquity = 15000000.00 + pnl;

    return NextResponse.json({
      ...data,
      "market_price": currentPrice,
      "total_equity": liveTotalEquity,
      "last_tick": new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      }
    });
  } catch (error) {
    return NextResponse.json({ "total_equity": 15000000, "status": "CACHE_STALE" });
  }
}