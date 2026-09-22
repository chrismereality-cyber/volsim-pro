import React, { useEffect, useState } from 'react';
import { useGlobalState } from '../context/GlobalStateContext';

const PortfolioOverviewView = () => {
  const { sockets } = useGlobalState();
  const [status, setStatus] = useState('Awaiting link...');

  useEffect(() => {
    // Rely solely on the global provider to avoid conflicts
    if (sockets['trading-state']) {
      sockets['trading-state'].onmessage = (event) => {
        setStatus('Active');
        console.log('Payload received:', JSON.parse(event.data));
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
