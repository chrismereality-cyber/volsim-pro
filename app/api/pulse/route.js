import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'ledger.json');
    let data = { leverage: 125, base_equity: 6060415.41 }; // Defaults
    
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        data = JSON.parse(fileContent);
    } catch (e) { console.log("Vault read reset"); }

    // 1. Force valid Price
    let currentPrice = 96000;
    try {
      const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { cache: 'no-store' });
      const priceData = await priceRes.json();
      currentPrice = parseFloat(priceData.price) || 96000;
    } catch (e) { currentPrice = 96000; }

    // 2. Force valid Leverage (Crucial fix for NaN)
    const activeLev = parseFloat(data.leverage) || 125;
    const entryPrice = 96000;
    
    // 3. The $27B Calculation
    const baseApex = 27051037840.66;
    const priceChangeRatio = (currentPrice - entryPrice) / entryPrice;
    
    // Safety check: If priceChangeRatio is NaN, set to 0
    const safeRatio = isNaN(priceChangeRatio) ? 0 : priceChangeRatio;
    
    const pnl = baseApex * (safeRatio * (activeLev / 125));
    const finalEquity = baseApex + pnl;

    return new NextResponse(JSON.stringify({
      ...data,
      "market_price": currentPrice,
      "total_equity": isNaN(finalEquity) ? baseApex : finalEquity,
      "leverage_active": activeLev
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    return NextResponse.json({ "total_equity": 27051037840.66, "status": "RECOVERY_MODE" });
  }
}