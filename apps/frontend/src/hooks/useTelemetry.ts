import { useState, useEffect } from 'react';

export function useTelemetry() {
  const [data, setData] = useState({
    account_state: { balance: 0, equity: 0, free_margin: 0, leverage: 100 },
    market_state: { bid: 0, ask: 0, spread: 0, market_regime: '', volatility: '' },
    execution_state: { bridge_connection_status: 'OFFLINE' },
    position_state: { open_positions: [], total_exposure: 0 },
    portfolio_state: { total_balance: 0, total_equity: 0, daily_profit: 0 },
    risk_state: { risk_per_trade: 0, current_drawdown: 0 },
    statistics_state: { total_trades: 0, win_rate: 0, profit_factor: 0, sharpe_ratio: 0 },
    vault_state: { vault_balance: 0, blockchain_status: '' },
    ai_state: { confidence_score: 0, current_recommendation: '', reasoning_summary: '' },
    timestamp: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTelemetry() {
      try {
        const response = await fetch('/api/proxy-telemetry', {
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`Telemetry fetch failed with status: ${response.status}`);
        }

        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1000);

    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}
