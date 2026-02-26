import React, { useState } from 'react';

const TradeButtons = () => {
  const [status, setStatus] = useState('Ready');

  const sendSignal = async (action) => {
    setStatus('Sending ' + action + '...');
    try {
      // This talks directly to your local bridge.py
      const response = await fetch('http://127.0.0.1:5000/set-signal?action=' + action);
      if (response.ok) {
        setStatus(action + ' Signal Sent Successfully!');
      } else {
        setStatus('Error: Bridge returned ' + response.status);
      }
    } catch (err) {
      setStatus('Error: Bridge not found. Is bridge.py running?');
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h3>Titan Trading Control</h3>
      <p>Status: <strong>{status}</strong></p>
      <button 
        onClick={() => sendSignal('BUY')}
        style={{ padding: '10px 20px', backgroundColor: 'green', color: 'white', marginRight: '10px', cursor: 'pointer' }}
      >
        BUY BTC
      </button>
      <button 
        onClick={() => sendSignal('SELL')}
        style={{ padding: '10px 20px', backgroundColor: 'red', color: 'white', cursor: 'pointer' }}
      >
        SELL BTC
      </button>
    </div>
  );
};

export default TradeButtons;
