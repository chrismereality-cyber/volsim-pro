"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';
import { API_URL } from './config';

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
        const res = await fetch(\/api/trade/status, { cache: 'no-store' });
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
    <div style={{ backgroundColor: '#000', color: '#fff', padding: '20px', fontFamily: 'monospace', height: '100vh' }}>
      <h2>VOLSIM PRO // v6.0 NEURAL</h2>
      <hr />
      <h3>{data.symbol} LIVE</h3>
      <p>STATUS: {data.status}</p>
      <div style={{ fontSize: '2em', color: data.profit >= 0 ? '#0f0' : '#f00' }}>
        PROFIT: $\
      </div>
      <p>Balance: $\</p>
      <p>Equity: $\</p>
      <button style={{ backgroundColor: 'red', color: 'white', padding: '10px', width: '100%', fontWeight: 'bold' }}>
        PANIC: CLOSE ALL
      </button>
    </div>
  );
}
