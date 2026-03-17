"use client";
import React, { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState({ balance: 0, equity: 0, profit: 0, symbol: "---", status: "CONNECTING" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://volsim-pro.onrender.com/api/trade/status", { cache: 'no-store' });
        const json = await res.json();
        setData(json);
      } catch (err) { console.log("Reconnecting to Render..."); }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const profitColor = data.profit >= 0 ? '#00ff41' : '#ff3131';

  return (
    <main style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: '"Courier New", Courier, monospace' }}>
      <header style={{ borderBottom: '1px solid #00ff41', paddingBottom: '10px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#00ff41', margin: 0, fontSize: '1.2rem', letterSpacing: '2px' }}>VOLSIM PRO // v6.0 NEURAL</h1>
          <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>STATUS: ENCRYPTED_LINK_ACTIVE</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.7rem' }}>
          SYSTEM TIME: {new Date().toLocaleTimeString()}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {/* Main Display Card */}
        <section style={{ border: '1px solid #1a1a1a', padding: '20px', backgroundColor: '#050505', borderRadius: '2px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.7rem', color: '#00ff41' }}>
            LIVE FEED ●
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.9rem', color: '#888' }}>ACTIVE_SYMBOL:</span>
            <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>{data.symbol}</span>
          </div>

          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '0.8rem', color: '#888', letterSpacing: '3px' }}>UNREALIZED P/L</div>
            <div style={{ fontSize: '5rem', fontWeight: 'bold', color: profitColor, textShadow: `0 0 15px ${profitColor}44` }}>
              ${Number(data.profit).toFixed(2)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', borderTop: '1px solid #1a1a1a', paddingTop: '20px' }}>
            <div style={{ borderRight: '1px solid #1a1a1a' }}>
              <div style={{ fontSize: '0.7rem', color: '#888' }}>ACCOUNT_BALANCE</div>
              <div style={{ fontSize: '1.5rem' }}>${Number(data.balance).toFixed(2)}</div>
            </div>
            <div style={{ paddingLeft: '10px' }}>
              <div style={{ fontSize: '0.7rem', color: '#888' }}>CURRENT_EQUITY</div>
              <div style={{ fontSize: '1.5rem' }}>${Number(data.equity).toFixed(2)}</div>
            </div>
          </div>
        </section>
      </div>

      <footer style={{ marginTop: '40px', display: 'flex', gap: '10px' }}>
        <button style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid #f00', color: '#f00', padding: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>
          PANIC: CLOSE ALL
        </button>
        <button style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid #00ff41', color: '#00ff41', padding: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
          NEURAL OPTIMIZE
        </button>
      </footer>
    </main>
  );
}
