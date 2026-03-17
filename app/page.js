"use client";
import React, { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState({ balance: 0, equity: 0, profit: 0, symbol: "BTCUSDm", status: "LIVE" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://volsim-pro.onrender.com/api/trade/status", { cache: 'no-store' });
        const json = await res.json();
        // Force conversion to numbers so they ALWAYS display
        setData({
          balance: parseFloat(json.balance) || 0,
          equity: parseFloat(json.equity) || 0,
          profit: parseFloat(json.profit) || 0,
          symbol: json.symbol || "BTCUSDm",
          status: "LIVE"
        });
      } catch (err) { console.log("Waiting for data..."); }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', padding: '40px', fontFamily: 'monospace', minHeight: '100vh' }}>
      <h2 style={{ color: '#0f0' }}>VOLSIM PRO // v6.0 NEURAL</h2>
      <hr style={{ borderColor: '#333' }} />
      <div style={{ marginTop: '20px', border: '1px solid #333', padding: '20px', borderRadius: '10px' }}>
        <h3>{data.symbol}</h3>
        <p>STATUS: <span style={{ color: '#0f0' }}>{data.status}</span></p>
        
        {/* If profit is 0, it will now show $0.00 instead of being blank */}
        <div style={{ fontSize: '3.5em', fontWeight: 'bold', color: data.profit >= 0 ? '#0f0' : '#f00', margin: '20px 0' }}>
          PROFIT: ${data.profit.toFixed(2)}
        </div>
        
        <div style={{ display: 'flex', gap: '50px', fontSize: '1.2em' }}>
          <div>
            <div style={{ color: '#888' }}>BALANCE</div>
            <div>${data.balance.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ color: '#888' }}>EQUITY</div>
            <div>${data.equity.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
