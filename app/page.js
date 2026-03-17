"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState({ balance: 0, equity: 0, profit: 0, symbol: "BOOTING...", status: "WAITING" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://volsim-pro.onrender.com/api/trade/status", { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        // Force conversion to numbers just in case
        setData({
          balance: parseFloat(json.balance) || 0,
          equity: parseFloat(json.equity) || 0,
          profit: parseFloat(json.profit) || 0,
          symbol: json.symbol || "BTCUSDm",
          status: json.status || "LIVE"
        });
      } catch (err) { console.log("Bridge connection pending..."); }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const profitColor = data.profit >= 0 ? '#0f0' : '#f00';

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', padding: '30px', fontFamily: 'monospace', minHeight: '100vh' }}>
      <h2 style={{ color: '#0f0' }}>VOLSIM PRO // v6.0 NEURAL</h2>
      <hr style={{ borderColor: '#333' }} />
      <div style={{ border: '1px solid #333', padding: '20px', borderRadius: '10px', marginTop: '20px' }}>
        <h3 style={{color: '#aaa'}}>{data.symbol}</h3>
        <p>STATUS: <span style={{ color: '#0f0' }}>{data.status}</span></p>
        
        <div style={{ fontSize: '3em', fontWeight: 'bold', color: profitColor, margin: '20px 0' }}>
          PROFIT: 
        </div>
        
        <div style={{ display: 'flex', gap: '40px' }}>
          <div>
            <div style={{ color: '#888' }}>BALANCE</div>
            <div style={{ fontSize: '1.5em' }}></div>
          </div>
          <div>
            <div style={{ color: '#888' }}>EQUITY</div>
            <div style={{ fontSize: '1.5em' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
