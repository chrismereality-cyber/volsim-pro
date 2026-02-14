import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'ledger.json');
    let data = { leverage: 125 };
    try { data = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) {}

    // Fetch Base Price
    let basePrice = 96420.00;
    try {
      const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { cache: 'no-store' });
      const priceData = await priceRes.json();
      basePrice = parseFloat(priceData.price) || 96420.00;
    } catch (e) {}

    // INJECT QUANTUM NOISE (Simulating micro-ticks)
    const noise = (Math.random() - 0.5) * (basePrice * 0.0001);
    const currentPrice = basePrice + noise;

    const activeLev = parseFloat(data.leverage) || 125;
    const entryPrice = 96000;
    const baseApex = 27051037840.66;
    
    // Calculate live equity with noise
    const priceChangeRatio = (currentPrice - entryPrice) / entryPrice;
    const pnl = baseApex * (priceChangeRatio * (activeLev / 125));
    const finalEquity = baseApex + pnl;

    return new NextResponse(JSON.stringify({
      ...data,
      "market_price": currentPrice,
      "total_equity": finalEquity,
      "leverage_active": activeLev,
      "tick_id": Math.random().toString(36).substring(7)
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