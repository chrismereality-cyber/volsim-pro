'use client';
import React, { useState, useEffect } from 'react';

export default function Terminal() {
  const [balance, setBalance] = useState('27,402,198,054.32');
  const [isGhost, setIsGhost] = useState(false);
  const [isLockdown, setIsLockdown] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [command, setCommand] = useState('');
  const [ticker, setTicker] = useState('BTC/USD 98,432.12 | ETH/USD 2,741.88');
  const [logs, setLogs] = useState([
    `[${new Date().toLocaleTimeString()}] VOLSIM_PRO_v4.0.0_INITIALIZED`,
    `[${new Date().toLocaleTimeString()}] ORACLE_SYNC: COMPLETE`
  ]);

  useEffect(() => {
    const tickerInt = setInterval(() => {
      setTicker(`BTC/USD ${(98000 + Math.random() * 500).toFixed(2)} | ETH/USD ${(2700 + Math.random() * 20).toFixed(2)} | SOL/USD ${(140 + Math.random() * 5).toFixed(2)}`);
    }, 3000);
    const bootTimer = setTimeout(() => setIsBooting(false), 2000);
    return () => { clearInterval(tickerInt); clearTimeout(bootTimer); };
  }, []);

  const executeTrade = () => {
    if (command.toLowerCase().trim() === 'init') {
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] > EXEC_SIG: TRADE_SENT`, ...prev]);
    }
    setCommand('');
    setShowInput(false);
  };

  if (isBooting) return <div style={{background:'#000',color:'#f33',height:'100vh',display:'flex',justifyContent:'center',alignItems:'center',fontFamily:'monospace'}}>INITIALIZING_VOLSIM_PRO...</div>;
  if (isGhost) return <div onTouchStart={() => { window.gT = setTimeout(()=>setIsGhost(false), 2000); }} onTouchEnd={() => clearTimeout(window.gT)} style={{background:'#000',height:'100vh',width:'100vw'}} />;
  if (isLockdown) return <div style={{background:'#400',color:'#fff',height:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',fontFamily:'monospace'}}><h1 onClick={()=>setIsLockdown(false)}>LOCKDOWN_ACTIVE</h1></div>;

  return (
    <div style={{ background: '#000', color: '#ff3333', height: '100vh', width: '100vw', padding: '20px', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      
      <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '20px' }}>TERMINAL: TRM-4353-APEX</div>

      {/* BALANCE TRIGGER */}
      <div onClick={() => setShowInput(!showInput)} style={{ cursor: 'pointer', zIndex: 10 }}>
        <h1 style={{ fontSize: '2.2rem', margin: '0' }}>${balance}</h1>
      </div>

      {showInput && (
        <input 
          autoFocus 
          value={command} 
          onChange={(e)=>setCommand(e.target.value)} 
          onKeyDown={(e)=>e.key==='Enter' && executeTrade()}
          style={{ background:'transparent', border:'none', borderBottom:'1px solid #f33', color:'#f33', textAlign:'center', marginTop:'10px', outline:'none' }}
          placeholder="COMMAND..."
        />
      )}

      {/* LOG AREA */}
      <div style={{ marginTop: '30px', width: '100%', fontSize: '0.7rem', opacity: 0.8, flexGrow: 1 }}>
        {logs.map((l, i) => <div key={i} style={{ marginBottom: '5px' }}>{l}</div>)}
      </div>

      {/* INTERACTION ZONE */}
      <div style={{ display: 'flex', gap: '30px', marginBottom: '60px', zIndex: 20 }}>
        <span onTouchStart={() => { window.lT = setTimeout(()=>setIsLockdown(true), 2500); }} onTouchEnd={() => clearTimeout(window.lT)} style={{ border: '1px solid #f333', padding: '5px 10px' }}>LOCKDOWN</span>
        <span onTouchStart={() => { window.gT = setTimeout(()=>setIsGhost(true), 2500); }} onTouchEnd={() => clearTimeout(window.gT)} style={{ border: '1px solid #f333', padding: '5px 10px' }}>GHOST</span>
      </div>

      {/* TICKER (NON-BLOCKING) */}
      <div style={{ position: 'absolute', bottom: '0', left: 0, width: '100%', background: '#000', padding: '10px 0', borderTop: '1px solid #f333', pointerEvents: 'none' }}>
        <marquee style={{ fontSize: '0.6rem' }}>{ticker}</marquee>
      </div>

    </div>
  );
}