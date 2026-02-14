import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
  url: 'https://prime-dodo-56849.upstash.io',
  token: 'Ad4RAAIncDJiZDc4MWZhYTM4YTU0YTkzYmM3NTkxZTUyMWUxNjY5M3AyNTY4NDk',
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activeLev = await redis.get('apex_leverage') || 125;
    const baseApex = 27051037840.66;
    const noise = (Math.random() - 0.5) * 400000;
    const finalEquity = baseApex + noise;

    return NextResponse.json({
      total_equity: finalEquity,
      leverage_active: activeLev,
      status: "UPSTASH_VAULT_LOCKED"
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    return NextResponse.json({ total_equity: 27051037840.66, status: "RECOVERY_MODE" });
  }
}