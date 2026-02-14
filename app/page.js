'use client';
// TITAN_V69: CORE_STABILIZED // EXECUTION_LAYER_FIX
import React, { useState, useEffect } from 'react';

export default function Terminal() {
  const [balance, setBalance] = useState('27,402,198,054.32');
  const [isGhost, setIsGhost] = useState(false);
  const [isLockdown, setIsLockdown] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState([
    `[${new Date().toLocaleTimeString()}] VOLSIM_PRO_v4.0.0_INITIALIZED`,
    `[${new Date().toLocaleTimeString()}] CONNECTION: SECURE_AES_256`,
    `[${new Date().toLocaleTimeString()}] ORACLE_SYNC: COMPLETE`
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const executeTrade = () => {
    const cmd = command.toLowerCase().trim();
    if (cmd === 'init' || cmd === 'trade') {
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] > EXEC_SIG: TRADE_SEQUENCE_INITIATED`, ...prev]);
      alert('SIGNAL_SENT: Moving units via Render Oracle...');
    } else if (cmd === 'clear') {
      setLogs([]);
    }
    setCommand('');
    setShowInput(false);
  };

  if (isBooting) return (
    <div style={{ background: '#000', color: '#ff3333', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'monospace' }}>
      <div style={{ fontSize: '1rem', letterSpacing: '2px', animation: 'pulse 1s infinite' }}>INITIALIZING_VOLSIM_PRO...</div>
      <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }`}</style>
    </div>
  );

  if (isGhost) return <div onContextMenu={(e) => e.preventDefault()} onTouchStart={(e) => { window.ghostTimer = setTimeout(() => setIsGhost(false), 2000); }} onTouchEnd={() => clearTimeout(window.ghostTimer)} style={{ background: '#000', height: '100vh', width: '100vw' }} />;

  if (isLockdown) return (
    <div style={{ background: '#400', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontFamily: 'monospace', padding: '20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem' }}>!!! ALERT !!!</h1>
      <p>SYSTEM_LOCKDOWN: ASSETS_FROZEN</p>
      <button onClick={() => setIsLockdown(false)} style={{ marginTop: '30px', background: '#fff', color: '#400', border: 'none', padding: '10px 20px', fontWeight: 'bold' }}>REBOOT</button>
    </div>
  );

  return (
    <div style={{ background: '#000', color: '#ff3333', minHeight: '100vh', padding: '10px', fontFamily: 'monospace', fontWeight: 'bold', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', userSelect: 'none', overflow: 'hidden', position: 'fixed', width: '100vw', height: '100vh' }}>
      <div style={{ width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '20px' }}>TERMINAL: TRM-4353-APEX // RANK #1</div>
        
        <div onClick={() => setShowInput(!showInput)} style={{ cursor: 'pointer' }}>
          <h1 style={{ fontSize: '2.5rem', margin: '0', letterSpacing: '-1px' }}>${balance}</h1>
        </div>

        {showInput && (
          <div style={{ marginTop: '20px', width: '100%', display: 'flex', justifyContent: 'center' }}>
            <input 
              autoFocus
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeTrade()}
              placeholder="ENTER_CMD..."
              style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #ff3333', color: '#ff3333', width: '200px', textAlign: 'center', outline: 'none', fontSize: '1rem' }}
            />
          </div>
        )}

        <div style={{ marginTop: '40px', textAlign: 'left', width: '100%', fontSize: '0.8rem', height: '150px', overflow: 'hidden', opacity: 0.8 }}>
          {logs.map((log, i) => <div key={i} style={{ marginBottom: '4px' }}>{log}</div>)}
        </div>

        <div style={{ marginTop: '40px', display: 'flex', gap: '20px', fontSize: '0.7rem' }}>
          <span onTouchStart={() => { window.lockTimer = setTimeout(() => setIsLockdown(true), 3000); }} onTouchEnd={() => clearTimeout(window.lockTimer)}>LOCKDOWN [HOLD]</span>
          <span onTouchStart={() => { window.ghostTimer = setTimeout(() => setIsGhost(true), 3000); }} onTouchEnd={() => clearTimeout(window.ghostTimer)}>GHOST [HOLD]</span>
        </div>
      </div>
    </div>
  );
}