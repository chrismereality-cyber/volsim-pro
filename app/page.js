"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState({ balance: 0, equity: 0, profit: 0, symbol: "---", status: "OFFLINE" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://volsim-pro.onrender.com/api/trade/status");
        const json = await res.json();
        setData(json);
      } catch (err) { console.error(err); }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', padding: '40px', fontFamily: 'monospace', minHeight: '100vh' }}>
      <h2 style={{ color: '#0f0' }}>VOLSIM PRO // v6.0 NEURAL</h2>
      <hr style={{ borderColor: '#333' }} />
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ color: '#fff' }}>{data.symbol}</h3>
        <p>STATUS: <span style={{ color: '#0f0' }}>{data.status}</span></p>
        <div style={{ fontSize: '3em', fontWeight: 'bold', color: data.profit >= 0 ? '#0f0' : '#f00' }}>
          PROFIT: 
        </div>
        <p style={{ fontSize: '1.5em' }}>Balance: </p>
        <p style={{ fontSize: '1.5em' }}>Equity: </p>
      </div>
    </div>
  );
}
