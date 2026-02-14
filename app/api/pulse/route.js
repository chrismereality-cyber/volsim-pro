import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    "base_equity": 5847507.52,
    "total_equity": 6060415.41,
    "market_price": 2616.61,
    "active_position": {"side": "BUY", "size": 4000000, "leverage": 125},
    "rank": "#2",
    "shadow_fork_active": false,
    "apex_target": 15000000
  });
}