"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://volsim-pro.onrender.com/api/trade/status");
        const json = await res.json();
        setData(json);
      } catch (err) { console.error("Fetch error:", err); }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div style={{color:'white', padding:'40px'}}>INITIALIZING NEURAL LINK...</div>;

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', padding: '30px', fontFamily: 'monospace', minHeight: '100vh' }}>
      <h2 style={{ color: '#0f0', marginBottom: '10px' }}>VOLSIM PRO // v6.0 NEURAL</h2>
      <div style={{ height: '2px', backgroundColor: '#333', marginBottom: '20px' }}></div>
      
      <div style={{ border: '1px solid #333', padding: '20px', borderRadius: '10px', backgroundColor: '#050505' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>{data.symbol || "BTCUSDm"}</h3>
        <p style={{ margin: '0 0 20px 0' }}>STATUS: <span style={{ color: '#0f0' }}>{data.status || "LIVE"}</span></p>
        
        <div style={{ marginBottom: '15px' }}>
            <span style={{ fontSize: '1.2em', color: '#888' }}>TOTAL PROFIT</span>
            <div style={{ fontSize: '3.5em', fontWeight: 'bold', color: (data.profit >= 0) ? '#0f0' : '#f00' }}>
              \
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px', borderTop: '1px solid #222', paddingTop: '20px' }}>
            <div>
                <span style={{ color: '#888' }}>BALANCE</span>
                <div style={{ fontSize: '1.5em' }}>\</div>
            </div>
            <div>
                <span style={{ color: '#888' }}>EQUITY</span>
                <div style={{ fontSize: '1.5em' }}>\</div>
            </div>
        </div>
      </div>

      <button 
        style={{ marginTop: '30px', width: '100%', padding: '20px', backgroundColor: '#f00', color: '#fff', border: 'none', fontWeight: 'bold', borderRadius: '5px', cursor: 'pointer' }}>
        PANIC: CLOSE ALL POSITIONS
      </button>
    </div>
  );
}
