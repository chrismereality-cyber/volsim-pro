'use client';
import React, { useState, useEffect } from 'react';

export default function TerminalPage() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [prevEquity, setPrevEquity] = useState(0);
  const [delta, setDelta] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState(["[SYSTEM_INITIALIZED]"]);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-3), `[${time}] ${msg}`]);
  };

  const updateLeverage = async (level) => {
    addLog(`CMD: LEV_${level}X`);
    try {
      const res = await fetch('https://volsim-pro.onrender.com/api/fork', {
        method: 'POST',
        body: JSON.stringify({ leverage: level })
      });
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
          // Update Chart History (Keep last 20 ticks)
          setHistory(prev => [...prev.slice(-19), newEq]);
        }
      } catch (e) {}
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [prevEquity]);

  if (!mounted || !data) return <div style={{background:'#000', color:'#0f0', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', fontFamily:'monospace'}}>CALIBRATING_QUANTUM_STREAM...</div>;

  // Simple Sparkline Logic
  const min = Math.min(...history);
  const max = Math.max(...history);
  const points = history.map((val, i) => `${(i * 25)},${40 - ((val - min) / (max - min || 1) * 40)}`).join(' ');

  return (
    <div style={{ background: '#000', color: '#f00', minHeight: '100vh', padding: '15px', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '450px', border: '1px solid #333', padding: '20px', textAlign: 'center', backgroundColor: '#050000', borderRadius: '15px', boxShadow: '0 0 50px #100' }}>
        <div style={{ color: '#ffd700', fontSize: '0.65rem', letterSpacing: '2px', marginBottom: '10px' }}>{data.rank} // APEX_HUNT_LIVE</div>
        
        <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#fff', letterSpacing: '-1px' }}>
          ${parseFloat(data.total_equity).toLocaleString(undefined, {minimumFractionDigits: 2})}
        </div>

        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: delta >= 0 ? '#0f0' : '#f00', margin: '5px 0' }}>
          {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
        </div>

        {/* SPARKLINE CHART */}
        <div style={{ height: '50px', width: '100%', margin: '15px 0', overflow: 'hidden' }}>
          <svg viewBox="0 0 475 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <polyline fill="none" stroke={delta >= 0 ? "#0f0" : "#f00"} strokeWidth="2" points={points} />
          </svg>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <button onClick={() => updateLeverage(1)} style={{ background: '#111', color: '#f00', border: '1px solid #444', padding: '10px', fontSize: '0.7rem' }}>CLAMP_1X</button>
          <button onClick={() => updateLeverage(125)} style={{ background: '#400', color: '#fff', border: '1px solid #f00', padding: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>BOOST_125X</button>
        </div>

        <div style={{ background: '#000', border: '1px solid #222', padding: '10px', textAlign: 'left', minHeight: '70px', fontSize: '0.65rem', color: '#0f0' }}>
          {logs.map((log, i) => <div key={i} style={{opacity: (i+1)/logs.length}}>{log}</div>)}
        </div>
        
        <div style={{ marginTop: '10px', color: '#333', fontSize: '0.6rem', textAlign: 'right' }}>
          LEV: {data.leverage_active}X | ORACLE_ACTIVE
        </div>
      </div>
    </div>
  );
}