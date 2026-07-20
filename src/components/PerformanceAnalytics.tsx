import React, { useEffect, useState } from 'react';
import { useGlobalState } from '../context/GlobalStateContext';

const PerformanceAnalytics = () => {
  const { sockets } = useGlobalState();
  const [data, setData] = useState(null);

  useEffect(() => {
    // Check if the trading-state socket is ready
    if (sockets['trading-state'] && sockets['trading-state'].readyState === WebSocket.OPEN) {
      sockets['trading-state'].onmessage = (event) => {
        setData(JSON.parse(event.data));
      };
    }
  }, [sockets]); // Only re-run if the socket object itself changes

  return <div>{data ? JSON.stringify(data) : 'Loading...'}</div>;
};

export default PerformanceAnalytics;
