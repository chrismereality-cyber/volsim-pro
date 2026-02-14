import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    "base_equity": 6060415.41,
    "total_equity": 15000000.00,
    "market_price": 2616.61,
    "active_position": {"side": "BUY", "size": "MAX", "leverage": "APEX"},
    "rank": "#1",
    "shadow_fork_active": true,
    "apex_target": 15000000
  });
}