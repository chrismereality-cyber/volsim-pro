'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Radio, AlertTriangle, Square } from 'lucide-react';

interface Position {
  ticket: string | number;
  symbol: string;
  type: string;
  volume: number;
  openPrice?: number;
  currentPrice?: number;
  profit?: number;
}

export default function LivePositionsView() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;

    function connectBridgeWS() {
      try {
        ws = new WebSocket('ws://localhost:10000/ws/trading-state');

        ws.onopen = () => setConnected(true);
        ws.onclose = () => {
          setConnected(false);
          setTimeout(connectBridgeWS, 3000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.positions && Array.isArray(data.positions)) {
              setPositions(data.positions);
            }
          } catch (err) {
            console.error("Error breaking socket stream packet:", err);
          }
        };
      } catch (e) {
        console.error("WebSocket construction failed:", e);
      }
    }

    connectBridgeWS();
    return () => ws?.close();
  }, []);

  const handleLiquidate = async (ticket: string | number) => {
    const ticketStr = String(ticket);
    setActionLoading(ticketStr);
    try {
      const response = await fetch('http://127.0.0.1:10000/api/positions/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket: ticketStr })
      });
      if (response.ok) {
        setPositions((prev) => prev.filter((p) => String(p.ticket) !== ticketStr));
      } else {
        alert("Failed to liquidate selected position asset.");
      }
    } catch (err) {
      console.error("Error issuing liquidation command:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const totalFloating = positions.reduce((acc, curr) => acc + (curr.profit || 0), 0);

  return (
    <div className="space-y-4 p-6 bg-black min-h-screen text-zinc-100 font-mono">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2 text-zinc-100">
            <Radio className={`w-4 h-4 ${connected ? 'text-emerald-500 animate-pulse' : 'text-rose-500'}`} />
            // VOLSIM BRIDGE FINAL WEBSOCKET STREAM LIVE
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Subscribed to real-time duplex MT5 core state tracking matrix.</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 text-xs px-3 py-1.5 uppercase font-bold text-zinc-400 tracking-wider">
          {positions.length} Active Orders Running
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950 overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-400 min-w-[800px]">
          <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3">Ticket</th>
              <th className="p-3">Symbol</th>
              <th className="p-3">Type</th>
              <th className="p-3 text-right">Volume</th>
              <th className="p-3 text-right">Open Price</th>
              <th className="p-3 text-right">Current Price</th>
              <th className="p-3 text-right">Floating P/L</th>
              <th className="p-3 text-center w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {positions.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center text-zinc-600 tracking-wider italic">
                  NO ACTIVE POSITIONS CAPTURED ON WEBSOCKET DEPLOYMENT FRAME
                </td>
              </tr>
            ) : (
              positions.map((pos) => {
                const isProfitable = (pos.profit || 0) >= 0;
                return (
                  <tr key={pos.ticket} className="border-b border-zinc-900 hover:bg-zinc-900/40 transition-colors">
                    <td className="p-3 text-zinc-500">#{pos.ticket}</td>
                    <td className="p-3 text-zinc-100 font-bold">{pos.symbol}</td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {pos.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium text-zinc-300">{(pos.volume || 0).toFixed(2)}</td>
                    <td className="p-3 text-right text-zinc-400">{(pos.openPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right text-zinc-300">{(pos.currentPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={`p-3 text-right font-bold ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isProfitable ? '+' : ''}${ (pos.profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) }
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleLiquidate(pos.ticket)}
                        disabled={actionLoading !== null}
                        className="w-full flex items-center justify-center gap-1 bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800 hover:border-rose-600 font-bold uppercase px-2 py-1 text-[10px] tracking-wider transition-all disabled:opacity-40"
                      >
                        <Square className="w-2.5 h-2.5 fill-current" />
                        {actionLoading === String(pos.ticket) ? 'Closing...' : 'Liquidate'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="bg-zinc-900/50 px-4 py-3 border-t border-zinc-800 flex justify-between items-center text-xs font-bold text-zinc-400 uppercase tracking-wider">
          <span>Composite Portfolio Exposure Summary</span>
          <span className={`text-sm font-black ${totalFloating >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            Total Net Margin Floating P/L: ${totalFloating.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}
