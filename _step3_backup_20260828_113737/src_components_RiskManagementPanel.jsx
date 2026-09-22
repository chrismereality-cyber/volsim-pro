import React, { useEffect, useState } from 'react';

export default function RiskManagementPanel() {
    const [riskData, setRiskData] = useState({
        current_drawdown: 0.0,
        maximum_allowed_drawdown: 5.0,
        risk_exposure: 0.0,
        risk_per_trade: 1.0,
        hedge_status: "INACTIVE",
        margin_usage: 0.0,
        liquidation_warning: false
    });
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        let isMounted = true;

        // Fetch initial telemetry via REST to guarantee immediate render
        const fetchTelemetry = async () => {
            try {
                const response = await fetch('http://127.0.0.1:10000/api/teleymetry');
                if (!response.ok) {
                    // Try root alias
                    const altResponse = await fetch('http://127.0.0.1:10000/telemetry');
                    if (altResponse.ok) {
                        const json = await altResponse.json();
                        parseAndUpdate(json);
                    }
                } else {
                    const json = await response.json();
                    parseAndUpdate(json);
                }
            } catch (err) {
                console.error("REST telemetry fetch error:", err);
            }
        };

        const parseAndUpdate = (data) => {
            if (!isMounted) return;
            const riskState = data.risk_state || data;
            setRiskData({
                current_drawdown: riskState.current_drawdown ?? 0.0,
                maximum_allowed_drawdown: riskState.maximum_allowed_drawdown ?? riskState.maximum_drawdown ?? 5.0,
                risk_exposure: riskState.portfolio_exposure ?? riskState.risk_exposure ?? 0.0,
                risk_per_trade: riskState.risk_per_trade ?? 1.0,
                hedge_status: riskState.hedge_status ?? "INACTIVE",
                margin_usage: riskState.margin_usage ?? 0.0,
                liquidation_warning: riskState.liquidation_warning ?? false
            });
            setConnected(true);
        };

        fetchTelemetry();

        // Connect via WebSocket for real-time updates
        const ws = new WebSocket(ws://127.0.0.1:10000/ws/trading-state);

        ws.onopen = () => {
            if (isMounted) setConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.risk_state) {
                    parseAndUpdate(data);
                }
            } catch (err) {
                console.error("Failed to parse risk telemetry state", err);
            }
        };

        ws.onerror = () => {
            // Fallback to periodic polling if WebSocket fails
            const interval = setInterval(fetchTelemetry, 2000);
            return () => clearInterval(interval);
        };

        return () => {
            isMounted = false;
            ws.close();
        };
    }, []);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-xl font-mono w-full">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold tracking-wider text-amber-400">RISK MANAGEMENT</h3>
                    <span className={inline-block w-2.5 h-2.5 rounded-full }></span>
                </div>
                <span className={px-2.5 py-1 text-xs rounded font-semibold }>
                    {riskData.liquidation_warning ? 'LIQUIDATION WARNING' : 'SYSTEM SECURE'}
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                    <span className="text-xs text-slate-400 block mb-1">Current Drawdown</span>
                    <span className="text-xl font-bold text-red-400">{Number(riskData.current_drawdown).toFixed(2)}%</span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                    <span className="text-xs text-slate-400 block mb-1">Maximum Drawdown</span>
                    <span className="text-xl font-bold text-slate-200">{Number(riskData.maximum_allowed_drawdown).toFixed(2)}%</span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                    <span className="text-xs text-slate-400 block mb-1">Risk Exposure</span>
                    <span className="text-lg font-semibold text-slate-200"></span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                    <span className="text-xs text-slate-400 block mb-1">Risk per Trade</span>
                    <span className="text-lg font-semibold text-sky-400">{Number(riskData.risk_per_trade).toFixed(2)}%</span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                    <span className="text-xs text-slate-400 block mb-1">Hedge Status</span>
                    <span className="text-sm font-bold text-indigo-400">{riskData.hedge_status}</span>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                    <span className="text-xs text-slate-400 block mb-1">Margin Usage</span>
                    <span className="text-lg font-semibold text-amber-300">{Number(riskData.margin_usage).toFixed(2)}%</span>
                </div>
            </div>
        </div>
    );
}
