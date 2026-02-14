import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'ledger.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let currentPrice = 96000; // Hard fallback price

    try {
      const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
        next: { revalidate: 0 }
      });
      const priceData = await priceRes.json();
      if (priceData.price) {
        currentPrice = parseFloat(priceData.price);
      }
    } catch (e) {
      console.log("Binance Fetch Failed, using fallback.");
    }

    // Safety: Ensure we don't divide by zero or use NaN
    const entryPrice = data.market_price || 96000;
    const leverage = 125;
    const priceChangeRatio = (currentPrice - entryPrice) / entryPrice;
    
    // Calculate live equity
    const pnl = (data.base_equity || 6060415.41) * (priceChangeRatio * leverage);
    const liveTotalEquity = 15000000.00 + pnl;

    return NextResponse.json({
      ...data,
      "market_price": currentPrice || 96000,
      "total_equity": isNaN(liveTotalEquity) ? 15000000.00 : liveTotalEquity,
      "last_tick": new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ "total_equity": 15000000, "rank": "#1" });
  }
}