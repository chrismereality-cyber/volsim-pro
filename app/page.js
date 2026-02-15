'use client';
import React, { useState, useEffect } from 'react';

export default function Terminal() {
  const [balance, setBalance] = useState('FETCHING...');
  const [status, setStatus] = useState('OFFLINE');
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [showInput, setShowInput] = useState(false);

  const RENDER_URL = "https://volsim-pro.onrender.com";

  const sync = async () => {
    try {
      // The 'cb' parameter forces the browser to ignore its old .00 cache
      const cacheBuster = Date.now();
      const res = await fetch(\\/api/deriv/account?cb=\\, {
        cache: 'no-store',
        mode: 'cors'
      });
      const data = await res.json();
      if (data.balance && data.balance !== 'FETCHING...') {
        setBalance(parseFloat(data.balance).toLocaleString(undefined, {minimumFractionDigits: 2}));
        setStatus('LIVE');
      }
    } catch (e) {
      setStatus('ERR_SYNC');
    }
  };

  useEffect(() => {
    sync();
    const interval = setInterval(sync, 4000);
    return () => clearInterval(interval);
  }, []);

  const executeCommand = async (e) => {
    if (e.key === 'Enter') {
      const cmd = command.toLowerCase().trim();
      if (cmd === 'init') {
        setLogs(prev => [\[\] > REQ_SENT: .00\, ...prev]);
        await fetch(\\/api/deriv/trade\, { 
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
    <div style={{ background: '#000', color: '#ff3333', height: '100vh', width: '100vw', padding: '20px', fontFamily: 'monospace', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem' }}>
        <span>ORACLE_V6_MASTER</span>
        <span style={{ color: status === 'LIVE' ? '#0f0' : '#f00' }}>{status}</span>
      </div>

      <div onClick={() => setShowInput(!showInput)} style={{ textAlign: 'center', marginTop: '60px', cursor: 'pointer' }}>
        <h1 style={{ fontSize: '2.8rem', margin: 0, letterSpacing: '-1px' }}>\</h1>
        <div style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '5px' }}>GLOBAL_REAL_EQUITY</div>
      </div>

      {showInput && (
        <input autoFocus value={command} onChange={e => setCommand(e.target.value)} onKeyDown={executeCommand}
          style={{ background:'transparent', border:'none', borderBottom:'1px solid #f33', color:'#f33', textAlign:'center', width:'100%', marginTop:'30px', outline:'none', fontSize: '1.2rem' }}
          placeholder="ENTER_SOVEREIGN_CMD" />
      )}

      <div style={{ marginTop: '50px', fontSize: '0.6rem', height: '100px', overflow: 'hidden', opacity: 0.7 }}>
        {logs.map((l, i) => <div key={i} style={{marginBottom: '5px'}}>{l}</div>)}
      </div>
    </div>
  );
}