'use client';
import React, { useState, useEffect } from 'react';

export default function Terminal() {
  const [balance, setBalance] = useState('SYNCING');
  const [status, setStatus] = useState('INITIALIZING');
  
  useEffect(() => {
    const sync = async () => {
      try {
        const res = await fetch(`https://volsim-pro.onrender.com/api/deriv/account?v=99&cb=${Date.now()}`);
        const data = await res.json();
        setBalance(data.balance || '0.00');
        setStatus('DEMO_FEED_ACTIVE');
      } catch (e) {
        setStatus('BACKEND_WAIT');
      }
    };
    const i = setInterval(sync, 2000);
    return () => clearInterval(i);
  }, []);

  return (
    <div style={{ background: '#000', color: '#0f0', height: '100vh', padding: '40px', fontFamily: 'monospace' }}>
      <div style={{ fontSize: '0.8rem', color: '#ff3333' }}>[SYSTEM_v99_STABLE]</div>
      <div style={{ fontSize: '1rem', marginTop: '20px' }}>STATUS: {status}</div>
      <div style={{ fontSize: '4rem', fontWeight: 'bold', marginTop: '40px' }}>${balance}</div>
      <div style={{ marginTop: '40px', opacity: 0.4 }}>Pattern: Searching for Momentum...</div>
    </div>
  );
}