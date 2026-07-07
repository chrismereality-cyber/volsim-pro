import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState({ current_vault: 0, current_equity: 0, last_sync: null });
  const [loading, setLoading] = useState(true);

  const fetchLatestData = async () => {
    try {
      // Direct connection to your Render Axiom Engine
      const response = await fetch('https://volsim-pro-33ts.onrender.com/latest');
      if (!response.ok) throw new Error('Network response was not ok');
      const jsonData = await response.json();
      setData(jsonData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching neural data:", error);
    }
  };

  useEffect(() => {
    fetchLatestData();
    // Refresh data every 3 seconds to match the MT5 bridge frequency
    const interval = setInterval(fetchLatestData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App" style={{ backgroundColor: '#0a0a0a', color: '#00ff41', minHeight: '100vh', padding: '20px', fontFamily: 'monospace' }}>
      <header className="App-header">
        <h1>VOLSIM AXIOM // NEURAL DASHBOARD</h1>
        <div style={{ border: '1px solid #00ff41', padding: '20px', marginTop: '50px', display: 'inline-block' }}>
          <h2>LIVE VAULT: ${data.current_vault?.toFixed(2) || "0.00"}</h2>
          <h3>EQUITY SYNC: ${data.current_equity?.toFixed(2) || "0.00"}</h3>
          <p>STATUS: {loading ? "CONNECTING..." : "LIVE_SYNC_ACTIVE"}</p>
          <small>LAST NEURAL PULSE: {data.last_sync ? new Date(data.last_sync).toLocaleTimeString() : "NEVER"}</small>
        </div>
      </header>
    </div>
  );
}

export default App;
