'use client';
import React, { useState, useEffect } from 'react';

export default function Terminal() {
  const [totalBalance, setTotalBalance] = useState(0);
  const [vaultCeiling, setVaultCeiling] = useState(0);
  const [status, setStatus] = useState('OFFLINE');
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [showInput, setShowInput] = useState(false);

  const RENDER_URL = "https://volsim-pro.onrender.com";

  const sync = async () => {
    try {
      const res = await fetch(`${RENDER_URL}/api/deriv/account?cb=${Date.now()}`);
      const data = await res.json();
      if (data.balance && data.balance !== 'FETCHING...') {
        setTotalBalance(parseFloat(data.balance));
        setStatus('LIVE');
      }
    } catch (e) { setStatus('ERR'); }
  };

  useEffect(() => {
    sync();
    const interval = setInterval(sync, 4000);
    const saved = localStorage.getItem('vault_limit');
    if (saved) setVaultCeiling(parseFloat(saved));
    return () => clearInterval(interval);
  }, []);

  const activeBalance = vaultCeiling > 0 ? vaultCeiling : totalBalance;
  const vaultedAmount = vaultCeiling > 0 ? (totalBalance - vaultCeiling) : 0;

  const handleCmd = (e) => {
    if (e.key === 'Enter') {
      const args = command.toLowerCase().trim().split(' ');
      const time = new Date().toLocaleTimeString();
      if (args[0] === 'vault') {
        const limit = parseFloat(args[1]);
        setVaultCeiling(limit);
        localStorage.setItem('vault_limit', limit);
        setLogs(prev => [`[${time}] VAULT_LIMIT_SET: $${limit}`, ...prev]);
      }
      if (args[0] === 'reset') {
        setVaultCeiling(0);
        localStorage.removeItem('vault_limit');
        setLogs(prev => [`[${time}] VAULT_RELEASED`, ...prev]);
      }
      setCommand('');
      setShowInput(false);
    }
  };

  return (
    <div style={{ background: '#000', color: '#ff3333', height: '100vh', width: '100vw', padding: '20px', fontFamily: 'monospace', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem' }}>
        <span>VOLSIM_VAULT_v1</span>
        <span style={{ color: status === 'LIVE' ? '#0f0' : '#f00' }}>{status}</span>
      </div>

      <div onClick={() => setShowInput(!showInput)} style={{ textAlign: 'center', marginTop: '60px', cursor: 'pointer' }}>
        <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>ACTIVE_CAPITAL</div>
        <h1 style={{ fontSize: '2.5rem', margin: '5px 0' }}>
          ${activeBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}
        </h1>
        
        {vaultedAmount > 0 && (
          <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #0f0', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.6rem', color: '#0f0' }}>VAULT_SECURED</div>
            <div style={{ fontSize: '1.5rem', color: '#0f0' }}>
              +${vaultedAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
          </div>
        )}
      </div>

      {showInput && (
        <input autoFocus value={command} onChange={e => setCommand(e.target.value)} onKeyDown={handleCmd}
          style={{ background:'transparent', border:'none', borderBottom:'1px solid #f33', color:'#f33', textAlign:'center', width:'100%', marginTop:'30px', outline:'none', fontSize: '1.1rem' }}
          placeholder="vault [limit] | reset" />
      )}

      <div style={{ marginTop: '30px', fontSize: '0.65rem', opacity: 0.4 }}>
        {logs.slice(0, 5).map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}