"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/status');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Link Broken");
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ backgroundColor: '#000', color: '#0f0', padding: '20px', fontFamily: 'monospace', height: '100vh' }}>
      <h1>VOLSIM-PRO ORACLE</h1>
      <hr style={{ borderColor: '#333' }} />
      
      <div style={{ border: '1px solid #0f0', padding: '20px', marginTop: '20px' }}>
        <h3>MARKET_PRICE: ${data ? data.market_price.toLocaleString() : "---"}</h3>
        <h3>SYSTEM_STATUS: {data ? data.status : "CONNECTING..."}</h3>
        <p>SHIELD_STATUS: {data ? data.shield : "---"}</p>
        <p style={{ color: '#00ff00' }}>$9,800 CEILING</p>
        <p style={{ color: '#ff0000' }}>$9,500 FLOOR</p>
      </div>

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#555' }}>
        UPTIME: {data ? data.uptime : 0}s | {data ? data.timestamp : ""}
      </div>
    </div>
  );
}

