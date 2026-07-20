import { useState, useEffect } from 'react';

export function useTelemetry(backendUrl = "http://127.0.0.1:10000") {
  const [data, setData] = useState({
    account_info: { balance: 0, equity: 0, free_margin: 0, spread: 0 },
    vault_total_balance: 0,
    active_hedges: [],
    analytics: {
      win_rate: 0,
      loss_rate: 0,
      profit_factor: 0,
      recovery_factor: 0,
      expectancy: 0,
      max_drawdown_cash: 0,
      total_trades: 0,
      net_profit: 0
    },
    active_positions_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTelemetry() {
      try {
        const response = await fetch(`${backendUrl}/engine/telemetry`);
        if (!response.ok) {
          throw new Error(`Telemetry fetch failed: ${response.statusText}`);
        }
        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    // High frequency interval pulling matching your MT5 terminal pace
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1000);

    return () => clearInterval(interval);
  }, [backendUrl]);

  return { data, loading, error };
}
