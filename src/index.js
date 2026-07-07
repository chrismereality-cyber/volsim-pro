import React, { useState, useEffect, memo, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { AdvancedRealTimeChart, TickerTape } from "react-ts-tradingview-widgets";
import { Shield, Zap, Cpu, Globe, Activity, Volume2 } from 'lucide-react';

// Memoize widgets to prevent flickering
const MemoizedTicker = memo(() => (
  <div style={{ height: '40px' }}>
    <TickerTape 
      colorTheme="dark" 
      symbols={[{proName:"BINANCE:BTCUSDT", title:"BTC"}, {proName:"OANDA:XAUUSD", title:"GOLD"}, {proName:"FX:EURUSD", title:"EURUSD"}]} 
    />
  </div>
));

const MemoizedChart = memo(({ symbol }) => (
  <div style={{ height: '500px', border: '1px solid #1a1a1a', borderRadius: '8px', overflow: 'hidden' }}>
    <AdvancedRealTimeChart theme="dark" symbol={symbol} autosize interval="1" timezone="Etc/UTC" hide_side_toolbar={false} allow_symbol_change={true} />
  </div>
));

const Dashboard = () => {
  const [data, setData] = useState({ vault: "26.46", equity: "17.07", status: "STABLE" });
  const [activeSymbol, setActiveSymbol] = useState("BINANCE:BTCUSDT");
  const [logs, setLogs] = useState([
    { id: 1, msg: "Neural Core Initialized", time: new Date().toLocaleTimeString() },
    { id: 2, msg: "Bridge Sync: Connected via Render", time: new Date().toLocaleTimeString() }
  ]);

  // Audio Context for the Alert
  const playAlert = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High A note
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2); // Short beep
  };

  // Monitor Status for Alerts
  useEffect(() => {
    if (data.status === 'OFFLINE') {
      playAlert();
    }
  }, [data.status]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `https://volsim-pro-33ts.onrender.com/latest?t=${Date.now()}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json', 'Cache-Control': 'no-cache' }
        });

        if (!res.ok) throw new Error('Gateway Offline');
        const json = await res.json();
        
        setData({ 
          vault: json.vault || "0.00", 
          equity: json.equity || "0.00", 
          status: "STABLE" 
        });

        const newLog = { 
          id: Date.now(), 
          msg: `Neural Sync: Vault $${json.vault || "0.00"} Received`, 
          time: new Date().toLocaleTimeString() 
        };
        setLogs(prev => [newLog, ...prev].slice(0, 5));

      } catch (e) { 
        setData(prev => ({ ...prev, status: "OFFLINE" })); 
      }
    };

    const itv = setInterval(fetchData, 3000);
    fetchData(); 
    return () => clearInterval(itv);
  }, []);

  const cardStyle = { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '20px' };
  const btnStyle = (sym) => ({
    padding: '8px 16px', borderRadius: '4px', border: '1px solid #333', cursor: 'pointer',
    backgroundColor: activeSymbol === sym ? '#00ff88' : 'transparent',
    color: activeSymbol === sym ? '#000' : '#fff', fontWeight: 'bold', fontSize: '0.7rem'
  });

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <MemoizedTicker />

      <div style={{ padding: '20px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#00ff88', margin: 0 }}>VOLSIM v6.5 <span style={{color:'#fff'}}>NEURAL ENGINE</span></h1>
            <p style={{ color: '#555', fontSize: '0.7rem' }}>CORE BRIDGE: ACTIVE | KAFKA GEN-13 STABILIZED</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ color: '#333', marginRight: '10px' }}><Volume2 size={14}/></div>
            <button onClick={() => setActiveSymbol("BINANCE:BTCUSDT")} style={btnStyle("BINANCE:BTCUSDT")}>BTC</button>
            <button onClick={() => setActiveSymbol("OANDA:XAUUSD")} style={btnStyle("OANDA:XAUUSD")}>GOLD</button>
            <button onClick={() => setActiveSymbol("FX:EURUSD")} style={btnStyle("FX:EURUSD")}>FOREX</button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div style={cardStyle}>
            <div style={{ color: '#555', fontSize: '0.65rem', marginBottom: '5px' }}><Shield size={12}/> LIVE VAULT</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>${data.vault}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ color: '#555', fontSize: '0.65rem', marginBottom: '5px' }}><Zap size={12}/> SYNTH EQUITY</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>${data.equity}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ color: '#555', fontSize: '0.65rem', marginBottom: '5px' }}><Cpu size={12}/> ENGINE STATUS</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: data.status === 'STABLE' ? '#00ff88' : '#ff4444' }}>{data.status}</div>
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: '15px', padding: '12px 20px', minHeight: '140px', borderLeft: `4px solid ${data.status === 'STABLE' ? '#00ff88' : '#ff4444'}` }}>
          <div style={{ color: '#00ff88', fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={12}/> NEURAL ACTIVITY LOG (KAFKA FEED)
          </div>
          {logs.map(log => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #111', padding: '4px 0', fontSize: '0.75rem' }}>
              <span style={{ color: '#888' }}>[{log.time}] <span style={{ color: '#eee' }}>{log.msg}</span></span>
              <span style={{ color: '#333' }}>ID:{log.id.toString().slice(-4)}</span>
            </div>
          ))}
        </div>

        <MemoizedChart symbol={activeSymbol} />

        <footer style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', color: '#222', fontSize: '0.65rem' }}>
          <span>NODE: HP-PRO-01 // ASYNC PUSHER v2.1</span>
          <span><Globe size={10}/> ENDPOINT: volsim-pro.onrender.com</span>
        </footer>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Dashboard />);
