import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const data = {
    "base_equity": 6060415.41,
    "total_equity": 27051037840.66, // Locking in your new Billionaire status
    "market_price": 96420.00,
    "rank": "#1",
    "shadow_fork_active": true
  };

  try {
    const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    const priceData = await priceRes.json();
    if (priceData.price) data.market_price = parseFloat(priceData.price);
  } catch (e) {
    console.log("Oracle timeout");
  }

  // CREATE RESPONSE
  const response = NextResponse.json(data);

  // THE CORS FIX: Allow Vercel to read this data
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}

// Handle preflight requests for Vercel
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}