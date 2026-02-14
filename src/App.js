import React, { useState, useEffect, useMemo } from 'react';

export default function App() {
  const [data, setData] = useState(null);
  const [leverage, setLeverage] = useState(25);
  const [priceHistory, setPriceHistory] = useState([]);
  const apiUrl = 'https://volsim-pro.onrender.com';

  useEffect(() => {
    const fetchPulse = async () => {
      try {
        const res = await fetch(`${apiUrl}/pulse?t=${Date.now()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setPriceHistory(prev => [...prev.slice(-29), parseFloat(json.market_price)]);
        }
      } catch (e) { console.error("Link Down"); }
    };
    fetchPulse();
    const interval = setInterval(fetchPulse, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (body) => {
    await fetch(`${apiUrl}/trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  };

  // Sparkline Logic
  const sparklinePath = useMemo(() => {
    if (priceHistory.length < 2) return "";
    const min = Math.min(...priceHistory);
    const max = Math.max(...priceHistory);
    const range = max - min || 1;
    return priceHistory.map((p, i) => 
      `${(i / 30) * 100},${100 - ((p - min) / range) * 100}`
    ).join(" L ");
  }, [priceHistory]);

  if (!data) return <div style={{background:'#000', color:'#ffd700', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', fontFamily:'monospace'}}>SYNCHRONIZING_TITAN_APEX...</div>;

  const isProfit = data.unrealized_pnl >= 0;
  const glowColor = isProfit ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)';

  return (
    <div style={{ backgroundColor: '#000', color: '#ffd700', minHeight: '100vh', padding: '20px', fontFamily: 'monospace' }}>
      <style>{`
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 10px ${glowColor}; }
          50% { box-shadow: 0 0 30px ${glowColor}; }
          100% { box-shadow: 0 0 10px ${glowColor}; }
        }
        .glow-box { animation: pulse-glow 2s infinite ease-in-out; }
        input[type=range] { -webkit-appearance: none; background: #333; height: 4px; border-radius: 5px; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #ffd700; cursor: pointer; }
      `}</style>

      <div style={{ maxWidth: '800px', margin: '0 auto', border: '2px solid #ffd700', padding: '30px' }}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', opacity: 0.8}}>
          <span>TITAN_V26 // APEX_TERMINAL</span>
          <span style={{color:'#0f0'}}>ETH_SPOT: ${data.market_price}</span>
        </div>

        {/* Real-Time Sparkline */}
        <div style={{ height: '60px', width: '100%', marginBottom: '20px', opacity: 0.5 }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <path d={`M ${sparklinePath}`} fill="none" stroke="#ffd700" strokeWidth="2" />
          </svg>
        </div>

        {/* Pulsing PnL Display */}
        <div className="glow-box" style={{textAlign:'center', padding:'40px 0', border:'1px solid #ffd700', marginBottom:'30px', transition: 'all 0.5s'}}>
          <div style={{opacity:0.5, fontSize:'0.7rem'}}>NET_WORTH_LIQUIDITY</div>
          <div style={{fontSize:'3.5rem', fontWeight:'bold'}}>${data.total_equity.toLocaleString()}</div>
          <div style={{color: isProfit ? '#0f0' : '#f00', fontSize:'1.5rem', marginTop:'10px'}}>
            PNL: {isProfit ? '+' : ''}${data.unrealized_pnl.toLocaleString()}
          </div>
        </div>

        {/* Leverage Slider */}
        <div style={{marginBottom:'30px'}}>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginBottom:'10px'}}>
            <span>LEVERAGE_ADJUSTMENT</span>
            <span style={{color:'#ffd700'}}>{leverage}x</span>
          </div>
          <input type="range" min="1" max="100" value={leverage} onChange={(e) => setLeverage(e.target.value)} style={{width:'100%'}} />
        </div>

        {/* Trade Controls */}
        {data.active_position?.side ? (
          <button onClick={() => handleAction({action:'CLOSE'})} style={{width:'100%', padding:'25px', background:'#fff', color:'#000', fontWeight:'bold', cursor:'pointer', border:'none', fontSize:'1.2rem'}}>EXIT_TITAN_POSITION</button>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
            <button onClick={() => handleAction({size:500000, leverage:leverage, side:'BUY'})} style={{padding:'25px', background:'#0f0', border:'none', fontWeight:'bold', cursor:'pointer', fontSize:'1rem'}}>LONG_500K ({leverage}x)</button>
            <button onClick={() => handleAction({size:500000, leverage:leverage, side:'SHORT'})} style={{padding:'25px', background:'#f00', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer', fontSize:'1rem'}}>SHORT_500K ({leverage}x)</button>
          </div>
        )}

        {/* History Log */}
        <div style={{marginTop:'40px', opacity: 0.6}}>
          <div style={{fontSize:'0.6rem', borderBottom:'1px solid #222', paddingBottom:'5px', marginBottom:'10px'}}>SESSION_LOG_V26</div>
          {data.history?.map((h, i) => (
            <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:'0.7rem', padding:'3px 0'}}>
              <span>EXIT_{h.type}</span>
              <span style={{color: parseFloat(h.profit) >= 0 ? '#0f0' : '#f00'}}>${h.profit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
