"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';

// Replace with your actual Render URL
const RENDER_URL = "https://volsim-pro.onrender.com";

export default function Dashboard() {
  const [data, setData] = useState({
    symbol: "Connecting...",
    balance: 0,
    equity: 0,
    profit: 0,
    status: "OFFLINE"
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(RENDER_URL + "/api/trade/status", { cache: 'no-store' });
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

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', padding: '20px', fontFamily: 'monospace', minHeight: '100vh' }}>
      <h2 style={{ color: '#0f0' }}>VOLSIM PRO // v6.0 NEURAL</h2>
      <hr style={{ borderColor: '#333' }} />
      <div style={{ padding: '20px', border: '1px solid #333', borderRadius: '8px' }}>
        <h3>{data.symbol} LIVE</h3>
        <p>STATUS: <span style={{ color: '#0f0' }}>{data.status}</span></p>
        <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: data.profit >= 0 ? '#0f0' : '#f00' }}>
          PROFIT: 
        </div>
        <p style={{ fontSize: '1.2em' }}>Balance: </p>
        <p style={{ fontSize: '1.2em' }}>Equity: </p>
      </div>
      <br />
      <button 
        onClick={() => alert('Initiating Panic Close...')}
        style={{ backgroundColor: '#f00', color: '#fff', border: 'none', padding: '15px', width: '100%', fontSize: '1.2em', fontWeight: 'bold', cursor: 'pointer' }}>
        PANIC: CLOSE ALL POSITIONS
      </button>
    </div>
  );
}
