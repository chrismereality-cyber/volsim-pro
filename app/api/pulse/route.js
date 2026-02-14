import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = {
    "base_equity": 6060415.41,
    "total_equity": 27051037840.66,
    "market_price": 96420.00,
    "rank": "#1",
    "shadow_fork_active": true,
    "status_msg": "SHADOW_FORK_ACTIVE"
  };

  try {
    const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', { cache: 'no-store' });
    const priceData = await priceRes.json();
    if (priceData.price) data.market_price = parseFloat(priceData.price);
  } catch (e) { console.log("Oracle fetch bypassed"); }

  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store, max-age=0, must-revalidate'
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}