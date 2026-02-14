'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function TerminalPage() {
  const [data, setData] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState([
    "INITIATING_TITAN_HANDSHAKE...",
    "ACCESS_GRANTED: RANK_1_CERTIFIED",
    "SHADOW_FORK_ACTIVE_LEVERAGE_125X"
  ]);
  const logEndRef = useRef(null);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-8), `[${time}] ${msg}`]);
  };

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const res = await fetch('https://volsim-pro.onrender.com/api/pulse?t=' + Date.now());
        if (res.ok) {
          const json = await res.json();
          setData(json);
          // Random system pulses
          const events = [
            `ORACLE_SCAN: BTC @ $${json.market_price}`,
            "LIQUIDITY_SHIELD_ACTIVE",
            "POSITION_MONITORING_GLOBAL",
            "CROSS_CHAIN_SYNC_STABLE"
          ];
          if (Math.random() > 0.7) addLog(events[Math.floor(Math.random() * events.length)]);
        }
      } catch (e) { console.error("Sync Error"); }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted || !data) return (
    <div style={{background:'#000', color:'#0f0', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', fontFamily:'monospace'}}>
      [ ESTABLISHING_TITAN_LINK... ]
    </div>
  );

  return (
    <div style={{ background: '#000', color: '#f00', minHeight: '100vh', padding: '20px', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: '850px', margin: '20px auto', border: '2px solid #500', padding: '40px', textAlign: 'center', backgroundColor: '#050000', boxShadow: '0 0 30px #200' }}>
        <div style={{ color: '#ffd700', letterSpacing: '3px', fontSize: '0.9rem' }}>{data.rank} // SECURE_LINE_ACTIVE</div>
        
        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', margin: '20px 0', color: '#fff', textShadow: '0 0 15px #f00' }}>
          ${parseFloat(data.total_equity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </div>
        
        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '20px', display: 'flex', justifyContent: 'space-around' }}>
          <span>LIVE_PULSE: ${data.market_price?.toLocaleString()}</span>
          <span>LEVERAGE: 125X</span>
          <span>SHADOW_FORK: YES</span>
        </div>

        {/* THE ACTIVITY LOG */}
        <div style={{ background: '#000', border: '1px solid #300', padding: '15px', textAlign: 'left', height: '150px', overflowY: 'hidden', fontSize: '0.75rem', color: '#0f0' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '4px', opacity: (i + 1) / logs.length }}>
              {log}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>

        <div style={{ marginTop: '20px', color: '#f00', fontSize: '0.8rem' }}>
          <span style={{ animation: 'blink 1s infinite' }}>[!]</span> SYSTEM_STABLE_APEX_REACHED
        </div>
      </div>
      <style>{` @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } } body { margin: 0; background: black; } `}</style>
    </div>
  );
}