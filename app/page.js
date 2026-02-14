'use client';
/* MOBILE_OPTIMIZATION_V1 */
import React, { useState, useEffect } from 'react';

export default function TerminalPage() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [prevEquity, setPrevEquity] = useState(0);
  const [delta, setDelta] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isLockdown, setIsLockdown] = useState(false);
  const [isGhost, setIsGhost] = useState(false);
  const [logs, setLogs] = useState(["[APEX_SYSTEM_READY]"]);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-3), `[${time}] ${msg}`]);
  };

  const triggerWithdraw = () => {
    setIsLockdown(true);
    addLog("CRITICAL: UNAUTHORIZED_WITHDRAWAL_DETECTED");
    setTimeout(() => {
      addLog("SYSTEM_LOCKDOWN: ASSETS_FROZEN_BY_ORACLE");
      setTimeout(() => setIsLockdown(false), 5000);
    }, 2000);
  };

  const updateLeverage = async (level) => {
    addLog(`CMD: LEV_${level}X`);
    try {
      const res = await fetch('https://volsim-pro.onrender.com/api/pulse', { method: 'GET' });
      if (res.ok) addLog(`STATE: LOCKED_${level}X`);
    } catch (e) { addLog("STATE: ERROR"); }
  };

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const res = await fetch('https://volsim-pro.onrender.com/api/pulse?t=' + Date.now());
        if (res.ok) {
          const json = await res.json();
          const newEq = parseFloat(json.total_equity);
          if (prevEquity !== 0) setDelta(newEq - prevEquity);
          setPrevEquity(newEq);
          setData(json);
          setHistory(prev => [...prev.slice(-19), newEq]);
        }
      } catch (e) {}
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
      if (isGhost) return (
    <div onDoubleClick={() => setIsGhost(false)} style={{ background: '#000', color: '#111', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: ''Courier New', monospace', fontWeight: 'bold', cursor: 'none' }}>
      <div style={{ fontSize: '0.8rem' }}>[SYSTEM_IDLE]</div>
      <div style={{ fontSize: '0.6rem', marginTop: '10px' }}>RE-AUTHENTICATION_REQUIRED</div>
    </div>
  );

  return () => clearInterval(interval);
  }, [prevEquity]);

  if (!mounted || !data) return <div style={{background:'#000', color:'#0f0', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', fontFamily:'monospace'}}>CALIBRATING_QUANTUM_STREAM...</div>;

  const min = Math.min(...history);
  const max = Math.max(...history);
  const points = history.map((val, i) => `${(i * 25)},${40 - ((val - min) / (max - min || 1) * 40)}`).join(' ');

    if (isGhost) return (
    <div onDoubleClick={() => setIsGhost(false)} style={{ background: '#000', color: '#111', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: ''Courier New', monospace', fontWeight: 'bold', cursor: 'none' }}>
      <div style={{ fontSize: '0.8rem' }}>[SYSTEM_IDLE]</div>
      <div style={{ fontSize: '0.6rem', marginTop: '10px' }}>RE-AUTHENTICATION_REQUIRED</div>
    </div>
  );

  return (
    <div style={{ background: isLockdown ? '#300' : '#000', color: '#f00', minHeight: '100vh', padding: '10px', fontFamily: ''Courier New', monospace', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'background 0.3s' }}>
      <div style={{ width: '100%', maxWidth: '100%', width: '100%', border: isLockdown ? '2px solid #f00' : '1px solid #333', padding: '20px', textAlign: 'center', backgroundColor: '#050000', borderRadius: '15px', boxShadow: isLockdown ? '0 0 100px #f00' : '0 0 50px #100' }}>
        
        <div style={{ color: isLockdown ? '#f00' : '#ffd700', fontSize: '0.65rem', fontWeight: 'bold' }}>
          {isLockdown ? "!!! SECURITY BREACH !!!" : "TERMINAL: TRM-4353-APEX // RANK #1"}
        </div>
        
        <div style={{ cursor: 'pointer', fontSize: '2.2rem', fontWeight: 'bold', color: '#fff', margin: '15px 0' }}>
          ${parseFloat(data.total_equity).toLocaleString(undefined, {minimumFractionDigits: 2})}
        </div>

        <div style={{ height: '50px', width: '100%', margin: '10px 0' }}>
          <svg viewBox="0 0 475 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <polyline fill="none" stroke={delta >= 0 ? "#0f0" : "#f00"} strokeWidth="2" points={points} />
          </svg>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <button onClick={() => updateLeverage(1)} style={{ background: '#111', color: '#f00', border: '1px solid #444', padding: '10px', fontSize: '0.7rem' }}>CLAMP_1X</button>
          <button onClick={() => updateLeverage(125)} style={{ background: '#400', color: '#fff', border: '1px solid #f00', padding: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>BOOST_125X</button>
        </div>

        {/* THE WITHDRAWAL TRAP */}
        <button 
          onClick={triggerWithdraw}
          style={{ width: '100%', padding: '10px', marginBottom: '15px', background: 'transparent', border: '2px dashed #500', color: '#500', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase' }}
        >
          Initiate Withdrawal
        </button>

        <div style={{ background: '#000', border: '1px solid #222', padding: '10px', textAlign: 'left', minHeight: '70px', fontSize: '0.65rem', color: isLockdown ? '#f00' : '#0f0' }}>
          {logs.map((log, i) => <div key={i} style={{opacity: (i+1)/logs.length}}>{log}</div>)}
        </div>
      </div>
    </div>
  );
}