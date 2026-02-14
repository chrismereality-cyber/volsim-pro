'use client';
import React, { useState, useEffect } from 'react';

export default function TerminalPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const apiUrl = 'https://volsim-pro.onrender.com';

  const fetchData = async () => {
    try {
      const res = await fetch(`${apiUrl}/pulse?t=${Date.now()}`, { mode: 'cors' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError(false);
      }
    } catch (e) {
      setError(true);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const triggerFork = () => fetch(`${apiUrl}/fork`, { method: 'POST', mode: 'cors' });

  if (!data) return (
    <div style={{background:'#000', color:'#0f0', height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'monospace'}}>
      <div>SYNCING_WITH_APEX_LEDGER...</div>
      {error && <div style={{color:'#f00', marginTop:'20px'}}>CONNECTION_ERROR: CHECK_RENDER_CORS</div>}
      <button onClick={() => window.location.reload()} style={{marginTop:'20px', background:'#333', color:'#fff', border:'none', padding:'10px'}}>RETRY_CONNECTION</button>
    </div>
  );

  return (
    <div style={{ background: '#000', color: data.shadow_fork_active ? '#f00' : '#0f0', minHeight: '100vh', padding: '20px', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', border: '2px solid #333', padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#ffd700' }}>{data.rank} // APEX_HUNT</h2>
        <div style={{ fontSize: '4rem', fontWeight: 'bold', margin: '40px 0' }}>
          ${data.total_equity.toLocaleString(undefined, {minimumFractionDigits: 2})}
        </div>
        {!data.shadow_fork_active ? (
          <button onClick={triggerFork} style={{ width: '100%', padding: '20px', background: '#f00', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '1.5rem', fontWeight: 'bold' }}>
            INITIALIZE_SHADOW_FORK
          </button>
        ) : (
          <div style={{ color: '#f00', fontSize: '2rem' }}>SHADOW_FORK_ACTIVE</div>
        )}
      </div>
    </div>
  );
}