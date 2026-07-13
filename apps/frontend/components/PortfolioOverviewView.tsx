'use client';
import React, { useEffect, useState } from 'react';
import { useGlobalState } from '../src/context/GlobalStateContext';

const PortfolioOverviewView = () => {
  const { sockets } = useGlobalState();
  const [status, setStatus] = useState('Awaiting Link Handshake');

  useEffect(() => {
    // Check if the trading-state socket is ready and assign the listener
    if (sockets && sockets['trading-state']) {
      sockets['trading-state'].onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log('--- PAYLOAD RECEIVED ---', payload);
          // Look for the specific confirmation from the backend
          if (payload.status === 'active') {
            setStatus('Active');
          }
        } catch (e) {
          console.error('Error parsing WebSocket data', e);
        }
      };
    }
  }, [sockets]);

  return (
    <div>
      <h3>Status: {status}</h3>
    </div>
  );
};

export default PortfolioOverviewView;
