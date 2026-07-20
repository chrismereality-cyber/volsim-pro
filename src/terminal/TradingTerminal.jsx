import React, { useEffect, useState } from 'react';

export default function TradingTerminal() {
  const [vault, setVault] = useState(null);

  useEffect(() => {
    import { WS_BASE } from '../apiConfig'; const ws = new WebSocket(\\/ws/vault\);

    ws.onmessage = (event) => {
      setVault(JSON.parse(event.data));
    };

    return () => ws.close();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>⚡ VolSim Trading Terminal</h2>

      <div>
        <h3>🏦 Vault Feed</h3>
        <pre>{JSON.stringify(vault, null, 2)}</pre>
      </div>
    </div>
  );
}
