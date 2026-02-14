import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = new Redis({
  url: 'https://prime-dodo-56849.upstash.io',
  token: 'Ad4RAAIncDJiZDc4MWZhYTM4YTU0YTkzYmM3NTkxZTUyMWUxNjY5M3AyNTY4NDk',
});

export async function POST(request) {
  try {
    const { leverage } = await request.json();
    await redis.set('apex_leverage', leverage);
    
    return NextResponse.json({ success: true, leverage }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}