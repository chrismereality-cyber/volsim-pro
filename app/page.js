'use client';
import React, { useState, useEffect } from 'react';

export default function Terminal() {
  const [balance, setBalance] = useState('SYNCING...');
  const [status, setStatus] = useState('WAITING');
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [showInput, setShowInput] = useState(false);

  const sync = async () => {
    try {
      const res = await fetch('https://volsim-pro.onrender.com/api/deriv/account');
      const data = await res.json();
      if (data.balance) {
        setBalance(parseFloat(data.balance).toLocaleString(undefined, {minimumFractionDigits: 2}));
        setStatus('LIVE');
      }
    } catch (e) {
      setStatus('OFFLINE');
      setLogs(prev => [\[\] BRIDGE_TIMEOUT\, ...prev]);
    }
  };

  useEffect(() => {
    sync();
    const interval = setInterval(sync, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCmd = async (e) => {
    if (e.key === 'Enter') {
      const cmd = command.toLowerCase().trim();
      if (cmd === 'init') {
        setLogs(prev => [\[\] > EXECUTING_ORDER...\, ...prev]);
        await fetch('https://volsim-pro.onrender.com/api/deriv/trade', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ amount: 1.00 }) 
        });
      }
      setCommand('');
      setShowInput(false);
    }
  };

  return (
    <div style={{ background: '#000', color: '#ff3333', height: '100vh', width: '100vw', padding: '20px', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.6 }}>
        <span>SOVEREIGN_V6</span>
        <span style={{ color: status === 'LIVE' ? '#0f0' : '#f00' }}>{status}</span>
      </div>

      <div onClick={() => setShowInput(!showInput)} style={{ textAlign: 'center', marginTop: '40px', cursor: 'pointer' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>\</h1>
        <div style={{ fontSize: '0.6rem', letterSpacing: '2px' }}>USD_EQUITY</div>
      </div>

      {showInput && (
        <input autoFocus value={command} onChange={e => setCommand(e.target.value)} onKeyDown={handleCmd}
          style={{ background:'transparent', border:'none', borderBottom:'1px solid #f33', color:'#f33', textAlign:'center', width:'100%', marginTop:'20px', outline:'none' }}
          placeholder="CMD_PROMPT" />
      )}

      <div style={{ marginTop: '40px', fontSize: '0.6rem' }}>
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}