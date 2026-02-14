import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const body = await request.json();
    const { leverage } = body;
    
    const filePath = path.join(process.cwd(), 'data', 'ledger.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Update the ledger with the new leverage
    data.leverage = leverage || 125;
    data.last_command = "LEVERAGE_SHIFT";
    data.last_update = new Date().toISOString();

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    const response = NextResponse.json({ success: true, leverage: data.leverage });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}