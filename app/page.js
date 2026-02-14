'use client';
import React, { useState, useEffect } from 'react';

export default function TerminalPage() {
  const [data, setData] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState(["SYSTEM_READY", "AWAITING_COMMAND..."]);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-6), `[${time}] ${msg}`]);
  };

  const updateLeverage = async (level) => {
    addLog(`INITIATING_LEVERAGE_SHIFT: ${level}X...`);
    // This will hit our existing fork API but we will expand it
    try {
      const res = await fetch('https://volsim-pro.onrender.com/api/fork', {
        method: 'POST',
        body: JSON.stringify({ leverage: level })
      });
      if (res.ok) addLog(`LEVERAGE_LOCKED: ${level}X`);
    } catch (e) { addLog("COMMS_ERROR_STAYING_AT_CURRENT_LEVEL"); }
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
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted || !data) return <div style={{background:'#000', color:'#0f0', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', fontFamily:'monospace'}}>SYNCING...</div>;

  return (
    <div style={{ background: '#000', color: '#f00', minHeight: '100vh', padding: '20px', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: '850px', margin: '20px auto', border: '2px solid #500', padding: '40px', textAlign: 'center', backgroundColor: '#050000' }}>
        <div style={{ color: '#ffd700' }}>{data.rank} // APEX_CORE</div>
        
        <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '20px 0', color: '#fff' }}>
          ${parseFloat(data.total_equity).toLocaleString(undefined, {minimumFractionDigits: 2})}
        </div>
        
        {/* CONTROL DECK */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
          <button onClick={() => updateLeverage(1)} style={{ background: '#200', color: '#f00', border: '1px solid #f00', padding: '10px 20px', cursor: 'pointer' }}>CLAMP_LEVERAGE (1X)</button>
          <button onClick={() => updateLeverage(125)} style={{ background: '#f00', color: '#000', border: '1px solid #f00', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}>MAX_BOOST (125X)</button>
        </div>

        <div style={{ background: '#000', border: '1px solid #300', padding: '15px', textAlign: 'left', height: '120px', fontSize: '0.75rem', color: '#0f0' }}>
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>
    </div>
  );
}