'use client';
import React, { useState, useEffect } from 'react';

export default function Terminal() {
  const [activeAccount, setActiveAccount] = useState('REAL');
  const [balance, setBalance] = useState(0.00);
  const [isGhost, setIsGhost] = useState(false);
  const [isLockdown, setIsLockdown] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState([]);

  // 1. SYNC WITH REAL DERIV DATA VIA RENDER
  const syncDeriv = async () => {
    try {
      // Replace with your actual Render URL
      const response = await fetch('https://volsim-pro.onrender.com/api/deriv/account');
      const data = await response.json();
      if (data.balance) setBalance(parseFloat(data.balance));
    } catch (e) {
      console.log("Sync Error: Backend not yet updated with API logic");
    }
  };

  useEffect(() => {
    setLogs([
      `[${new Date().toLocaleTimeString()}] VOLSIM_PRO_v6.0_LIVE`,
      `[${new Date().toLocaleTimeString()}] ACCOUNT: REAL_DERIV_SYNCED`,
      `[${new Date().toLocaleTimeString()}] SECURITY: ADMIN_TOKEN_DETECTED (CAUTION)`
    ]);
    syncDeriv();
    const bootTimer = setTimeout(() => setIsBooting(false), 2000);
    return () => clearTimeout(bootTimer);
  }, []);

  // 2. REAL TRADE EXECUTION
  const executeCommand = async () => {
    const cmd = command.toLowerCase().trim();
    const time = new Date().toLocaleTimeString();

    if (cmd === 'init') {
      setLogs(prev => [`[${time}] > SENDING_REAL_ORDER: $10.00 USD...`, ...prev]);
      
      const response = await fetch('https://volsim-pro.onrender.com/api/deriv/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'buy', amount: 10 }) // Safety cap at $10
      });

      const result = await response.json();
      if (result.status === 'success') {
        setLogs(prev => [`[${time}] > EXECUTION_SUCCESS: ORDER_ID_${result.id}`, ...prev]);
        syncDeriv();
      } else {
        setLogs(prev => [`[${time}] > EXECUTION_FAILED: ${result.message}`, ...prev]);
      }
    }
    
    setCommand('');
    setShowInput(false);
  };

  if (isBooting) return <div style={{background:'#000',color:'#f33',height:'100vh',display:'flex',justifyContent:'center',alignItems:'center',fontFamily:'monospace'}}>DECRYPTING_REAL_FEED...</div>;
  if (isGhost) return <div onMouseDown={()=>{setIsGhost(false)}} style={{background:'#000',height:'100vh',width:'100vw'}} />;
  
  return (
    <div style={{ background: '#000', color: '#ff3333', height: '100vh', width: '100vw', padding: '20px', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <div style={{ fontSize: '0.6rem', opacity: 0.5, marginBottom: '20px' }}>REAL_SOVEREIGN_TERMINAL</div>
      
      <div onClick={() => setShowInput(!showInput)} style={{ cursor: 'pointer', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.1rem', margin: '0' }}>${balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</h1>
        <div style={{ fontSize: '0.6rem', color: '#0f0' }}>● LIVE_CONNECTION</div>
      </div>

      {showInput && (
        <input 
          autoFocus value={command} 
          onChange={(e)=>setCommand(e.target.value)} 
          onKeyDown={(e)=>e.key==='Enter' && executeCommand()}
          style={{ background:'transparent', border:'none', borderBottom:'1px solid #f33', color:'#f33', textAlign:'center', marginTop:'15px', outline:'none', width: '80%' }}
          placeholder="ENTER_LIVE_CMD..."
        />
      )}

      <div style={{ marginTop: '30px', width: '100%', fontSize: '0.65rem', opacity: 0.8, flexGrow: 1 }}>
        {logs.map((l, i) => <div key={i} style={{ marginBottom: '4px' }}>{l}</div>)}
      </div>
    </div>
  );
}