import React, { useEffect, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import { heartbeatVar } from './apollo-client';
import './Heartbeat.css';

const Heartbeat = ({ btcPrice }) => {
  const pulse = useReactiveVar(heartbeatVar);
  const [mapleRatio, setMapleRatio] = useState(0);
  
  // 2026 Spot Price for the Maple Leaf (approx. $5,081.43)
  const GOLD_MAPLE_PRICE = 5081.43; 

  useEffect(() => {
    if (btcPrice) {
      setMapleRatio((btcPrice / GOLD_MAPLE_PRICE).toFixed(2));
    }
  }, [btcPrice]);

  return (
    <div className="heartbeat-container">
      <div className={`heartbeat-dot ${pulse ? 'pulse-a' : 'pulse-b'}`}></div>
      <div className="heartbeat-info">
        <span className="heartbeat-label">ENGINE LIVE</span>
        <span className="maple-ratio">{mapleRatio} MAPLES / BTC</span>
      </div>
    </div>
  );
};

export default Heartbeat;
