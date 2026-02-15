'use client';
import React, { useState, useEffect } from 'react';

export default function Terminal() {
  const [balance, setBalance] = useState('0.00');
  const [status, setStatus] = useState('CONNECTING...');
  
  const sync = async () => {
    try {
      // Use a unique query string to force Render to give new data
      const res = await fetch(`https://volsim-pro.onrender.com/api/deriv/account?t=${Date.now()}`);
      const data = await res.json();
      if (data.balance) {
        setBalance(parseFloat(data.balance).toFixed(2));
        setStatus('LIVE_DEMO_FEED');
      }
    } catch (e) {
      setStatus('OFFLINE');
    }
  };

  useEffect(() => {
    sync();
    const i = setInterval(sync, 2000);
    return () => clearInterval(i);
  }, []);

  return (
    <div style={{ background: '#000', color: '#0f0', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
      <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{status}</div>
      <h1 style={{ fontSize: '4rem', margin: '20px 0' }}>${balance}</h1>
      <div style={{ fontSize: '0.6rem', color: '#555' }}>NO_REAL_TOKEN_DETECTED</div>
    </div>
  );
}