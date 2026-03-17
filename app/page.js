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
      } catch (err) { console.log("Link Pending..."); }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const profitColor = data.profit >= 0 ? '#0f0' : '#f00';

  return (
    <main style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '20px', fontFamily: 'monospace' }}>
      <header style={{ borderBottom: '2px solid #0f0', paddingBottom: '10px', marginBottom: '30px' }}>
        <h1 style={{ color: '#0f0', margin: 0, fontSize: '1.4rem' }}>VOLSIM PRO // v6.0 NEURAL</h1>
        <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>ACTIVE MT5 BRIDGE // SECURE ENCRYPTED CHANNEL</div>
      </header>

      <section style={{ border: '1px solid #333', padding: '20px', backgroundColor: '#050505', borderRadius: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontSize: '1.1rem' }}>ASSET: <b>{data.symbol}</b></span>
          <span style={{ color: '#0f0' }}>● {data.status}</span>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>UNREALIZED PROFIT/LOSS</div>
          <div style={{ fontSize: '4.5rem', fontWeight: 'bold', color: profitColor }}>
            ${Number(data.profit).toFixed(2)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid #222', paddingTop: '20px' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#888' }}>BALANCE</div>
            <div style={{ fontSize: '1.6rem' }}>${Number(data.balance).toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#888' }}>EQUITY</div>
            <div style={{ fontSize: '1.6rem' }}>${Number(data.equity).toFixed(2)}</div>
          </div>
        </div>
      </section>

      <footer style={{ marginTop: '50px', textAlign: 'center' }}>
        <button style={{ backgroundColor: '#f00', color: '#fff', border: 'none', padding: '15px 30px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '2px', boxShadow: '0 0 15px #f00' }}>
          TERMINATE ALL POSITIONS
        </button>
      </footer>
    </main>
  );
}
