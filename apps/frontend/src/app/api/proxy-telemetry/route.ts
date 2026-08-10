import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/telemetry', {
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error(`[Telemetry Proxy] Backend error status: ${response.status}`);
            return NextResponse.json({ error: 'Backend unreachable' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (err: any) {
        console.error('[Telemetry Proxy] Fetch exception:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
