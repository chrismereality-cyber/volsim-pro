'use client';
import React, { useState, useEffect } from 'react';

export default function Terminal() {
  // 1. DUAL-ACCOUNT STATE
  const [activeAccount, setActiveAccount] = useState('MAIN'); // MAIN or VAULT
  const [balances, setBalances] = useState({ MAIN: 27402198054.32, VAULT: 1050200340.00 });
  
  const [isGhost, setIsGhost] = useState(false);
  const [isLockdown, setIsLockdown] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [command, setCommand] = useState('');
  const [ticker, setTicker] = useState('BTC/USD 98,432.12 | ETH/USD 2,741.88');
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // Sync with storage
    const saved = localStorage.getItem('volsim_dual_ledger');
    if (saved) setBalances(JSON.parse(saved));

    setLogs([
      `[${new Date().toLocaleTimeString()}] VOLSIM_PRO_v5.0.0_SOVEREIGN_ACTIVE`,
      `[${new Date().toLocaleTimeString()}] BROKER_BRIDGE: CONNECTED_SECURE`,
      `[${new Date().toLocaleTimeString()}] VAULT_READY: ENCRYPTED`
    ]);

    const tickerInt = setInterval(() => {
      setTicker(`BTC/USD ${(98000 + Math.random() * 500).toFixed(2)} | ETH/USD ${(2700 + Math.random() * 20).toFixed(2)}`);
      setBalances(prev => {
        const next = { ...prev, [activeAccount]: prev[activeAccount] + (Math.random() > 0.5 ? 240.50 : -180.20) };
        localStorage.setItem('volsim_dual_ledger', JSON.stringify(next));
        return next;
      });
    }, 3000);

    setTimeout(() => setIsBooting(false), 2000);
    return () => clearInterval(tickerInt);
  }, [activeAccount]);

  // 2. COMMAND LOGIC (THE BRAIN)
  const executeCommand = () => {
    const cmd = command.toLowerCase().trim();
    const time = new Date().toLocaleTimeString();

    if (cmd === 'vault') {
      setActiveAccount('VAULT');
      setLogs(prev => [`[${time}] > ACCESS_GRANTED: VAULT_LEDGER`, ...prev]);
    } else if (cmd === 'main') {
      setActiveAccount('MAIN');
      setLogs(prev => [`[${time}] > ACCESS_GRANTED: MAIN_LEDGER`, ...prev]);
    } else if (cmd.startsWith('withdraw ')) {
      const amt = cmd.split(' ')[1];
      setLogs(prev => [`[${time}] > WITHDRAW_REQ: $${amt} TO_EXTERNAL_COLD_WALLET`, `[${time}] > STATUS: PENDING_ORACLE_SIG`, ...prev]);
      alert(`WITHDRAWAL_SEQUENCE_STARTED: $${amt}`);
    } else if (cmd === 'init') {
      setLogs(prev => [`[${time}] > EXEC_SIG: MARKET_ORDER_SENT_TO_BROKER`, ...prev]);
    }
    setCommand('');
    setShowInput(false);
  };

  if (isBooting) return <div style={{background:'#000',color:'#f33',height:'100vh',display:'flex',justifyContent:'center',alignItems:'center',fontFamily:'monospace'}}>BOOTING_SOVEREIGN_SYSTEM...</div>;
  if (isGhost) return <div onMouseDown={()=>{window.gT=setTimeout(()=>setIsGhost(false),1000)}} onTouchStart={()=>{window.gT=setTimeout(()=>setIsGhost(false),1000)}} style={{background:'#000',height:'100vh',width:'100vw'}} />;
  if (isLockdown) return <div onClick={()=>setIsLockdown(false)} style={{background:'#400',color:'#fff',height:'100vh',display:'flex',justifyContent:'center',alignItems:'center',fontFamily:'monospace'}}><h1>SYSTEM_FROZEN</h1></div>;

  return (
    <div style={{ background: '#000', color: '#ff3333', height: '100vh', width: '100vw', padding: '20px', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
      
      <div style={{ fontSize: '0.6rem', opacity: 0.5, marginBottom: '20px', letterSpacing: '2px' }}>
        {activeAccount}_TERMINAL // APEX_V5
      </div>

      <div onClick={() => setShowInput(!showInput)} style={{ cursor: 'pointer', zIndex: 10, textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.1rem', margin: '0' }}>
          ${balances[activeAccount].toLocaleString(undefined, {minimumFractionDigits: 2})}
        </h1>
        <div style={{ fontSize: '0.6rem', color: '#0f0', opacity: 0.8 }}>● BROKER_LIVE</div>
      </div>

      {showInput && (
        <input 
          autoFocus 
          value={command} 
          onChange={(e)=>setCommand(e.target.value)} 
          onKeyDown={(e)=>e.key==='Enter' && executeCommand()}
          style={{ background:'transparent', border:'none', borderBottom:'1px solid #f33', color:'#f33', textAlign:'center', marginTop:'15px', outline:'none', fontSize: '1rem', width: '80%' }}
          placeholder="ENTER_SOVEREIGN_CMD..."
        />
      )}

      <div style={{ marginTop: '30px', width: '100%', fontSize: '0.65rem', opacity: 0.8, flexGrow: 1, overflow: 'hidden' }}>
        {logs.slice(0, 8).map((l, i) => <div key={i} style={{ marginBottom: '4px', borderLeft: '2px solid #f333', paddingLeft: '8px' }}>{l}</div>)}
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '60px', zIndex: 20 }}>
        <span onMouseDown={()=>{window.lT=setTimeout(()=>setIsLockdown(true),1500)}} onTouchStart={()=>{window.lT=setTimeout(()=>setIsLockdown(true),1500)}} style={{ border: '1px solid #f333', padding: '8px 12px', fontSize: '0.7rem' }}>LOCKDOWN</span>
        <span onMouseDown={()=>{window.gT=setTimeout(()=>setIsGhost(true),1500)}} onTouchStart={()=>{window.gT=setTimeout(()=>setIsGhost(true),1500)}} style={{ border: '1px solid #f333', padding: '8px 12px', fontSize: '0.7rem' }}>GHOST</span>
      </div>

      <div style={{ position: 'absolute', bottom: '0', left: 0, width: '100%', background: '#000', padding: '8px 0', borderTop: '1px solid #f333', pointerEvents: 'none' }}>
        <marquee style={{ fontSize: '0.55rem' }}>{ticker}</marquee>
      </div>
    </div>
  );
}