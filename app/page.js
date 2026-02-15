'use client';
import React, { useState, useEffect } from 'react';

export default function Terminal() {
  const [balance, setBalance] = useState('FETCHING...');
  const [isGhost, setIsGhost] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState([]);

  const syncDeriv = async () => {
    try {
      const res = await fetch('https://volsim-pro.onrender.com/api/deriv/account');
      const data = await res.json();
      if (data.balance) {
        setBalance(parseFloat(data.balance).toLocaleString(undefined, {minimumFractionDigits: 2}));
      }
    } catch (e) {
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] ERROR: CONN_REFUSED`, ...prev]);
    }
  };

  useEffect(() => {
    setLogs([`[${new Date().toLocaleTimeString()}] VOLSIM_V6_MASTER_SYNC_ACTIVE`]);
    syncDeriv();
    const ticker = setInterval(syncDeriv, 5000);
    const boot = setTimeout(() => setIsBooting(false), 2000);
    return () => { clearInterval(ticker); clearTimeout(boot); };
  }, []);

  const executeCommand = async () => {
    if (command.toLowerCase().trim() === 'init') {
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] > SIG_SENT: $1.00 USD`, ...prev]);
      await fetch('https://volsim-pro.onrender.com/api/deriv/trade', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ amount: 1.00 }) 
      });
      setTimeout(syncDeriv, 2000);
    }
    setCommand('');
    setShowInput(false);
  };

  if (isBooting) return <div style={{background:'#000',color:'#f33',height:'100vh',display:'flex',justifyContent:'center',alignItems:'center',fontFamily:'monospace'}}>ESTABLISHING_ORACLE_LINK...</div>;
  if (isGhost) return <div onMouseDown={()=>setIsGhost(false)} style={{background:'#000',height:'100vh',width:'100vw'}} />;

  return (
    <div style={{ background: '#000', color: '#ff3333', height: '100vh', width: '100vw', padding: '20px', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: '0.6rem', opacity: 0.5, marginBottom: '20px' }}>SOVEREIGN_V6_REAL</div>
      <div onClick={() => setShowInput(!showInput)} style={{ cursor: 'pointer', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.4rem', margin: '0' }}>${balance}</h1>
        <div style={{ fontSize: '0.6rem', color: '#0f0' }}>â— ORACLE_ONLINE</div>
      </div>
      {showInput && (
        <input autoFocus value={command} onChange={(e)=>setCommand(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && executeCommand()}
          style={{ background:'transparent', border:'none', borderBottom:'1px solid #f33', color:'#f33', textAlign:'center', marginTop:'15px', outline:'none', width: '80%', fontSize: '1.2rem' }}
          placeholder="EXECUTE..." />
      )}
      <div style={{ marginTop: '30px', width: '100%', fontSize: '0.65rem', opacity: 0.8, flexGrow: 1, overflow: 'hidden' }}>
        {logs.slice(0, 10).map((l, i) => <div key={i} style={{ marginBottom: '4px' }}>{l}</div>)}
      </div>
    </div>
  );
}