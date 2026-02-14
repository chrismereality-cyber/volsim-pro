'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function TerminalPage() {
  const [data, setData] = useState(null);
  const [prevEquity, setPrevEquity] = useState(0);
  const [delta, setDelta] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState(["[SYSTEM_ONLINE]"]);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-4), `[${time}] ${msg}`]);
  };

  const updateLeverage = async (level) => {
    addLog(`CMD: LEV_SHIFT_${level}X`);
    try {
      const res = await fetch('https://volsim-pro.onrender.com/api/fork', {
        method: 'POST',
        body: JSON.stringify({ leverage: level })
      });
      if (res.ok) addLog(`STATE: CONFIRMED_${level}X`);
    } catch (e) { addLog("STATE: TIMEOUT"); }
  };

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const res = await fetch('https://volsim-pro.onrender.com/api/pulse?t=' + Date.now());
        if (res.ok) {
          const json = await res.json();
          const newEquity = parseFloat(json.total_equity);
          if (prevEquity !== 0) {
            setDelta(newEquity - prevEquity);
          }
          setPrevEquity(newEquity);
          setData(json);
        }
      } catch (e) {}
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [prevEquity]);

  if (!mounted || !data) return <div style={{background:'#000', color:'#0f0', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', fontFamily:'monospace'}}>CONNECTING...</div>;

  return (
    <div style={{ background: '#000', color: '#f00', minHeight: '100vh', padding: '15px', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '500px', border: '1px solid #333', padding: '20px', textAlign: 'center', backgroundColor: '#050000', borderRadius: '12px', boxShadow: '0 0 40px #100' }}>
        <div style={{ color: '#ffd700', fontSize: '0.7rem', opacity: 0.8 }}>{data.rank} // QUANTUM_LINK_ACTIVE</div>
        
        {/* THE MAIN BALANCE */}
        <div style={{ fontSize: '2.4rem', fontWeight: 'bold', margin: '15px 0', color: '#fff', letterSpacing: '-1px' }}>
          ${parseFloat(data.total_equity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </div>

        {/* THE VELOCITY TICKER */}
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px', color: delta >= 0 ? '#0f0' : '#f00', height: '20px' }}>
          {delta !== 0 ? (delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString()) : 'STABLE'}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => updateLeverage(1)} style={{ background: '#100', color: '#f00', border: '1px solid #400', padding: '12px', fontSize: '0.7rem' }}>CLAMP_1X</button>
          <button onClick={() => updateLeverage(125)} style={{ background: '#300', color: '#fff', border: '1px solid #f00', padding: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>BOOST_125X</button>
        </div>

        <div style={{ background: '#000', border: '1px solid #111', padding: '10px', textAlign: 'left', minHeight: '80px', fontSize: '0.65rem', color: '#0f0', overflow: 'hidden' }}>
          {logs.map((log, i) => <div key={i} style={{opacity: (i+1)/logs.length}}>{log}</div>)}
        </div>

        <div style={{ marginTop: '15px', color: '#333', fontSize: '0.6rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>BTC: ${data.market_price?.toLocaleString()}</span>
          <span>LEV: {data.leverage_active}X</span>
        </div>
      </div>
    </div>
  );
}