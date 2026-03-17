"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';

const RENDER_URL = "https://volsim-pro.onrender.com";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(RENDER_URL + "/api/trade/status");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div style={{color:'white'}}>Loading System...</div>;

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', padding: '20px', fontFamily: 'monospace', minHeight: '100vh' }}>
      <h2 style={{ color: '#0f0' }}>VOLSIM PRO // v6.0 NEURAL</h2>
      <hr style={{ borderColor: '#333' }} />
      <div style={{ padding: '20px', border: '1px solid #333', borderRadius: '8px' }}>
        <h3>{data.symbol}</h3>
        <p>STATUS: <span style={{ color: '#0f0' }}>{data.status}</span></p>
        
        {/* We use .toFixed(2) to ensure the numbers appear as currency */}
        <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: data.profit >= 0 ? '#0f0' : '#f00' }}>
          PROFIT: \
        </div>
        <p style={{ fontSize: '1.2em' }}>Balance: \</p>
        <p style={{ fontSize: '1.2em' }}>Equity: \</p>
      </div>
    </div>
  );
}
