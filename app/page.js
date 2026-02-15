'use client';
import React, { useState, useEffect } from 'react';

export default function Terminal() {
  const [balance, setBalance] = useState('FETCHING...');
  const [status, setStatus] = useState('OFFLINE');
  const [logs, setLogs] = useState([]);
  
  const RENDER_URL = "https://volsim-pro.onrender.com";

  const sync = async () => {
    try {
      const res = await fetch(`${RENDER_URL}/api/deriv/account?cb=${Date.now()}`);
      const data = await res.json();
      
      // Force balance update even if it's the same number
      if (data.balance) {
        setBalance(parseFloat(data.balance).toLocaleString(undefined, {minimumFractionDigits: 2}));
        setStatus('LIVE_DEMO');
      }
    } catch (e) {
      setStatus('SYNC_ERR');
    }
  };

  useEffect(() => {
    sync();
    const interval = setInterval(sync, 3000); // Faster sync for demo tracking
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: '#000', color: '#ff3333', height: '100vh', width: '100vw', padding: '20px', fontFamily: 'monospace', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem' }}>
        <span>SOVEREIGN_V6_DEMO</span>
        <span style={{ color: '#0f0' }}>{status}</span>
      </div>

      <div style={{ textAlign: 'center', marginTop: '80px' }}>
        <div style={{ fontSize: '0.6rem', opacity: 0.5, letterSpacing: '2px' }}>VIRTUAL_ORACLE_EQUITY</div>
        <h1 style={{ fontSize: '3rem', margin: '10px 0', color: '#fff' }}>${balance}</h1>
        <div style={{ fontSize: '0.6rem', color: '#0f0', animation: 'pulse 2s infinite' }}>● AUTOPILOT_ENGAGED</div>
      </div>

      <div style={{ marginTop: '60px', borderTop: '1px solid #333', paddingTop: '20px' }}>
        <div style={{ fontSize: '0.7rem', color: '#555' }}>SYSTEM_LOGS:</div>
        <div style={{ fontSize: '0.6rem', color: '#444', marginTop: '10px' }}>
          [OK] PORT_10000_CONNECTED<br/>
          [OK] R_50_INDEX_FEED_ACTIVE<br/>
          [OK] MOMENTUM_SENSOR_LIVE
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}