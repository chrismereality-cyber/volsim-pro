'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function TerminalPage() {
  const [data, setData] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState(["[SECURE_CHANNEL_INIT]"]);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-5), `[${time}] ${msg}`]);
  };

  const updateLeverage = async (level) => {
    addLog(`CMD: SET_LEV_${level}X`);
    try {
      const res = await fetch('https://volsim-pro.onrender.com/api/fork', {
        method: 'POST',
        body: JSON.stringify({ leverage: level })
      });
      if (res.ok) addLog(`STATE: LOCKED_${level}X`);
    } catch (e) { addLog("STATE: COMMS_TIMEOUT"); }
  };

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const res = await fetch('https://volsim-pro.onrender.com/api/pulse?t=' + Date.now());
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {}
    };
    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, []);

  if (!mounted || !data) return <div style={{background:'#000', color:'#0f0', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', fontFamily:'monospace'}}>RE-ESTABLISHING_LINK...</div>;

  return (
    <div style={{ background: '#000', color: '#f00', minHeight: '100vh', padding: '10px', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '600px', border: '1px solid #400', padding: '20px', textAlign: 'center', backgroundColor: '#050000', borderRadius: '8px', marginTop: '20px' }}>
        <div style={{ color: '#ffd700', fontSize: '0.8rem', letterSpacing: '2px' }}>{data.rank} // APEX_CORE</div>
        
        <div style={{ fontSize: 'clamp(1.5rem, 8vw, 2.8rem)', fontWeight: 'bold', margin: '20px 0', color: '#fff', wordBreak: 'break-all' }}>
          ${parseFloat(data.total_equity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <button onClick={() => updateLeverage(1)} style={{ background: '#200', color: '#f00', border: '1px solid #f00', padding: '15px 5px', fontSize: '0.7rem', cursor: 'pointer' }}>CLAMP_1X</button>
          <button onClick={() => updateLeverage(125)} style={{ background: '#f00', color: '#000', border: '1px solid #f00', padding: '15px 5px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}>BOOST_125X</button>
        </div>

        <div style={{ background: '#000', border: '1px solid #222', padding: '10px', textAlign: 'left', minHeight: '100px', fontSize: '0.7rem', color: '#0f0' }}>
          {logs.map((log, i) => <div key={i} style={{opacity: (i+1)/logs.length}}>{log}</div>)}
        </div>

        <div style={{ marginTop: '15px', color: '#444', fontSize: '0.6rem' }}>
          PULSE: ${data.market_price?.toLocaleString()} | LEVERAGE: {data.leverage_active}X
        </div>
      </div>
    </div>
  );
}