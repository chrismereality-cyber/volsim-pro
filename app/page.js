'use client';
import { useState, useEffect } from 'react';

export default function ApexTerminal() {
  const [data, setData] = useState({ total_equity: 27051037840.66, leverage_active: 125 });
  const [isLockdown, setIsLockdown] = useState(false);
  const [isGhost, setIsGhost] = useState(false);
  const [logs, setLogs] = useState(["[APEX_SYSTEM_READY]"]);

  // Long-Press Logic
  let timer;
  const startPress = () => timer = setTimeout(() => setIsGhost(true), 1000);
  const stopPress = () => clearTimeout(timer);

  const fetchData = async () => {
    try {
      const res = await fetch('https://volsim-pro.onrender.com/api/pulse');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Pulse Lost");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const setLeverage = async (val) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] STATE: LOCKED_${val}X`, ...prev.slice(0, 5)]);
    await fetch('https://volsim-pro.onrender.com/api/fork', {
      method: 'POST',
      body: JSON.stringify({ leverage: val })
    });
    fetchData();
  };

  // 1. GHOST SCREEN (Privacy)
  if (isGhost) return (
    <div style={{ background: '#000', color: '#111', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'monospace', touchAction: 'none' }}>
      <div style={{ fontSize: '0.8rem' }}>[SYSTEM_IDLE]</div>
      <button onClick={() => setIsGhost(false)} style={{ marginTop: '20px', background: 'transparent', border: '1px solid #111', color: '#111', padding: '5px 10px', fontSize: '0.6rem', cursor: 'pointer' }}>RE-AUTHENTICATE</button>
    </div>
  );

  // 2. LOCKDOWN SCREEN (Security Breach)
  if (isLockdown) return (
    <div style={{ background: '#400', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'monospace', textAlign: 'center', padding: '20px' }}>
      <h1 style={{ fontSize: '1.5rem' }}>!!! SECURITY BREACH !!!</h1>
      <p style={{ fontSize: '0.8rem' }}>UNAUTHORIZED_WITHDRAWAL_DETECTED</p>
      <p style={{ fontSize: '0.6rem', marginTop: '20px' }}>SYSTEM_LOCKDOWN: ASSETS_FROZEN_BY_ORACLE</p>
      <button onClick={() => setIsLockdown(false)} style={{ marginTop: '30px', background: '#fff', color: '#400', border: 'none', padding: '10px 20px', fontWeight: 'bold' }}>REBOOT SYSTEM</button>
    </div>
  );

  // 3. MAIN TERMINAL UI
  return (
    <div style={{ background: '#000', color: '#ff3333', minHeight: '100vh', padding: '10px', fontFamily: 'Courier New, monospace', fontWeight: 'bold', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', userSelect: 'none' }}>
      <div style={{ width: '100%', maxWidth: '100%' }}>
        <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '20px', textAlign: 'center' }}>TERMINAL: TRM-4353-APEX // RANK #1</div>
        
        {/* THE BALANCE (LONG-PRESS TRIGGER) */}
        <div 
          onTouchStart={startPress} onTouchEnd={stopPress} 
          onMouseDown={startPress} onMouseUp={stopPress}
          style={{ fontSize: '2.2rem', textAlign: 'center', margin: '20px 0', textShadow: '0 0 10px rgba(255,51,51,0.5)', cursor: 'pointer', touchAction: 'manipulation' }}
        >
          ${parseFloat(data.total_equity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>

        {/* CONTROLS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <button onClick={() => setLeverage(1)} style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '15px', fontSize: '0.8rem' }}>CLAMP_1X</button>
          <button onClick={() => setLeverage(125)} style={{ background: '#600', color: '#fff', border: 'none', padding: '15px', fontSize: '0.8rem' }}>BOOST_125X</button>
        </div>

        <button onClick={() => setIsLockdown(true)} style={{ width: '100%', background: 'transparent', color: '#ff3333', border: '1px solid #ff3333', padding: '12px', fontSize: '0.7rem', marginBottom: '15px' }}>Initiate Withdrawal</button>

        {/* LOGS */}
        <div style={{ background: '#050000', padding: '10px', fontSize: '0.6rem', height: '80px', overflow: 'hidden', border: '1px solid #200' }}>
          {logs.map((log, i) => <div key={i} style={{ marginBottom: '2px', opacity: 1 - i*0.2 }}>{log}</div>)}
        </div>

        {/* WHALE FEED */}
        <div style={{ marginTop: '15px', background: '#0a0000', border: '1px solid #200', padding: '5px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'inline-block', animation: 'marquee 20s linear infinite', fontSize: '0.6rem', color: '#600' }}>
            WHALE_ALERT: 4,200 BTC moved to Coinbase ... LIQUIDATION: $960M Short ... LEV: {data.leverage_active}X | ORACLE_ACTIVE
          </div>
          <style>{`@keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}</style>
        </div>
      </div>
    </div>
  );
}