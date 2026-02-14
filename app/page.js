'use client';
import React, { useState, useEffect } from 'react';

export default function TerminalPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    try {
      const apiUrl = typeof window !== 'undefined' && window.location.hostname.includes('render.com') 
        ? '/api/pulse' 
        : 'https://volsim-pro.onrender.com/api/pulse';
      
      const res = await fetch(`${apiUrl}?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError(false);
      }
    } catch (e) {
      console.error("Pulse Error:", e);
      setError(true);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000); // 1-second refresh
    return () => clearInterval(interval);
  }, []);

  if (!data) return (
    <div style={{background:'#000', color:'#0f0', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', fontFamily:'monospace'}}>
      SYNCING_LIVE_ORACLE...
    </div>
  );

  return (
    <div style={{ background: '#000', color: '#f00', minHeight: '100vh', padding: '20px', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', border: '2px solid #300', padding: '40px', textAlign: 'center', boxShadow: '0 0 20px #500' }}>
        <div style={{ color: '#ffd700', marginBottom: '10px' }}>{data.rank} // APEX_HUNT</div>
        <div style={{ fontSize: '0.8rem', color: '#600' }}>BTC_ORACLE: ${data.market_price?.toLocaleString()}</div>
        
        <div style={{ fontSize: '4rem', fontWeight: 'bold', margin: '30px 0', letterSpacing: '-2px' }}>
          ${parseFloat(data.total_equity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </div>
        
        <div style={{ borderTop: '1px solid #300', paddingTop: '20px' }}>
          <span style={{ animation: 'blink 1s infinite' }}>●</span> SHADOW_FORK_ACTIVE
        </div>
      </div>
      <style>{`
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}