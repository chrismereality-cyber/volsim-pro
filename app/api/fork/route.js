import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  const filePath = path.join(process.cwd(), 'data', 'ledger.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  data.shadow_fork_active = true;
  data.total_equity = 15000000.00;
  data.rank = "#1";
  data.last_update = new Date().toISOString();

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  return NextResponse.json({ success: true, message: "APEX_STATE_SAVED" });
}