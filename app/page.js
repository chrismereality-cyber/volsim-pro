'use client';
import React, { useState, useEffect } from 'react';

export default function TerminalPage() {
  const [data, setData] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const apiUrl = window.location.hostname.includes('render.com') 
          ? '/api/pulse' 
          : 'https://volsim-pro.onrender.com/api/pulse';
        
        const res = await fetch(`${apiUrl}?t=${Date.now()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        setError(true);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted || !data) return (
    <div style={{background:'#000', color:'#0f0', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', fontFamily:'monospace'}}>
      [ CONNECTING_TO_APEX_ORACLE... ]
    </div>
  );

  return (
    <div style={{ background: '#000', color: '#f00', minHeight: '100vh', padding: '20px', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: '800px', margin: '50px auto', border: '2px solid #500', padding: '40px', textAlign: 'center', backgroundColor: '#050000' }}>
        <div style={{ color: '#ffd700', textTransform: 'uppercase', letterSpacing: '2px' }}>
          {data.rank} // SECURE_LINE_ACTIVE
        </div>
        
        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', margin: '30px 0', textShadow: '0 0 10px #f00' }}>
          ${parseFloat(data.total_equity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </div>
        
        <div style={{ fontSize: '0.9rem', color: '#888', marginBottom: '20px' }}>
          MARKET_PULSE: ${(data.market_price || 0).toLocaleString()} | LEVERAGE: 125X
        </div>

        <div style={{ borderTop: '1px solid #300', paddingTop: '20px', fontSize: '1.2rem' }}>
          <span style={{ animation: 'blink 1s infinite' }}>ÃƒÂ¢Ã¢â‚¬â€Ã‚Â</span> SHADOW_FORK_ENABLED
        </div>
      </div>
      <style>{`
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
        body { margin: 0; background: black; }
      `}</style>
    </div>
  );
}