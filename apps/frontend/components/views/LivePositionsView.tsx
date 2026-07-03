'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Radio, ShieldAlert } from 'lucide-react';

interface Position {
  ticket: string | number;
  symbol: string;
  type: string;
  volume: number;
  openPrice?: number;
  price_open?: number;
  open_price?: number;
  currentPrice?: number;
  price_current?: number;
  current_price?: number;
  floatingPL?: number;
  profit?: number;
}

export default function LivePositionsView() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  
  // Track reconnection attempts for exponential backoff
  const reconnectAttempts = useRef<number>(0);
  const maxDelay = 16000; // Cap backoff at 16 seconds

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    function connectBridgeWS() {
      try {
        ws = new WebSocket('ws://localhost:8080/ws/trading-state');

        ws.onopen = () => {
          setConnected(true);
          setError(false);
          reconnectAttempts.current = 0; // Reset backoff factor on successful handshake
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (Array.isArray(data)) {
              setPositions(data);
            } else if (data.positions && Array.isArray(data.positions)) {
              setPositions(data.positions);
            } else if (data.active_orders && Array.isArray(data.active_orders)) {
              setPositions(data.active_orders);
            }
          } catch (parseErr) {
            console.error("Bridge packet parse matrix failure:", parseErr);
          }
        };

        ws.onclose = () => {
          setConnected(false);
          
          // Institutional Exponential Backoff calculation with randomized jitter
          const baseDelay = Math.min(maxDelay, 1000 * Math.pow(2, reconnectAttempts.current));
          const jitter = Math.random() * 1000; 
          const finalDelay = baseDelay + jitter;
          
          reconnectAttempts.current += 1;
          
          console.warn(`Bridge pipeline dropped. Retrying handshake in ${Math.round(finalDelay)}ms...`);
          reconnectTimeout = setTimeout(connectBridgeWS, finalDelay);
        };

        ws.onerror = () => {
          setError(true);
          if (ws) ws.close();
        };
      } catch (err) {
        setError(true);
        // Fallback retry sequence if socket instantiation itself breaks
        reconnectTimeout = setTimeout(connectBridgeWS, 2000);
      }
    }

    connectBridgeWS();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  const totalPL = positions.reduce((sum, pos) => {
    const pl = pos.floatingPL ?? pos.profit ?? 0;
    return sum + pl;
  }, 0);

  if (!connected && positions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 font-mono text-xs tracking-widest">
        <RefreshCw className="w-4 h-4 animate-spin mr-2 text-emerald-500" />
        INITIALIZING LOW-LATENCY DUPLEX HANDSHAKE [/ws/trading-state]...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Network Connectivity Alert Panel */}
      {!connected && (
        <div className="flex items-center justify-between border border-amber-950/60 bg-amber-950/20 px-4 py-2.5 rounded-sm font-mono text-[11px] text-amber-400 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>[PIPELINE INTERRUPTED]: Server connection dropped. Retrying routing handshake via backoff cycle...</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-800/40 bg-amber-950/80 text-[10px] uppercase tracking-wider font-bold">
            <ShieldAlert className="w-3 h-3 text-amber-500" /> STALE DATA SCREEN
          </div>
        </div>
      )}

      {/* Main Framework Status Banner */}
      <div className="flex items-center justify-between border border-zinc-800 bg-zinc-950/40 p-4 rounded-sm font-mono text-xs tracking-wider">
        <div className="space-y-1">
          <div className={`${connected ? 'text-emerald-400' : 'text-amber-500'} flex items-center gap-2`}>
            <Radio className={`w-3.5 h-3.5 ${connected ? 'text-emerald-400 animate-pulse' : 'text-amber-500'}`} />
            <span>// VOLSIM BRIDGE FINAL WEBSOCKET {connected ? 'STREAM LIVE' : 'DISCONNECTED'}</span>
          </div>
          <p className="text-zinc-500">Subscribed to real-time duplex MT5 core state tracking matrix.</p>
        </div>
        <div className="text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded text-[10px] font-bold tracking-wider">
          {positions.length} ACTIVE ORDERS RUNNING
        </div>
      </div>

      {/* Positions Matrix Table Workspace */}
      <div className="border border-zinc-800 bg-zinc-950/20 rounded-sm overflow-hidden shadow-xl font-mono text-xs">
        <div className="grid grid-cols-7 p-3 text-zinc-500 border-b border-zinc-900 bg-zinc-950 text-[10px] uppercase tracking-widest font-bold">
          <div>Ticket</div>
          <div>Symbol</div>
          <div>Type</div>
          <div className="text-right">Volume</div>
          <div className="text-right">Open Price</div>
          <div className="text-right">Current Price</div>
          <div className="text-right">Floating P/L</div>
        </div>

        {/* Dynamic opacity transition if data becomes stale */}
        <div className={`divide-y divide-zinc-900/60 transition-opacity duration-300 ${connected ? 'opacity-100' : 'opacity-40 select-none pointer-events-none'}`}>
          {positions.length === 0 ? (
            <div className="p-8 text-center text-zinc-600 tracking-wider">
              NO ACTIVE POSITIONS CAPTURED ON WEBSOCKET DEPLOYMENT FRAME
            </div>
          ) : (
            positions.map((pos, idx) => {
              const ticketVal = pos.ticket ?? `pos-${idx}`;
              const symbolVal = pos.symbol ?? 'UNKNOWN';
              const typeVal = String(pos.type ?? 'BUY').toUpperCase();
              const volumeVal = pos.volume ?? 0.0;
              
              const openPriceVal = pos.openPrice ?? pos.price_open ?? pos.open_price ?? 0;
              const currentPriceVal = pos.currentPrice ?? pos.price_current ?? pos.current_price ?? 0;
              const floatingPLVal = pos.floatingPL ?? pos.profit ?? 0;
              
              const isProfit = floatingPLVal >= 0;

              return (
                <div key={String(ticketVal)} className="grid grid-cols-7 px-3 py-3 items-center hover:bg-zinc-900/20 transition-colors">
                  <div className="text-zinc-500">{String(ticketVal).startsWith('#') ? ticketVal : `#${ticketVal}`}</div>
                  <div className="text-zinc-200 font-bold">{symbolVal}</div>
                  <div>
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                      typeVal.includes('BUY') || typeVal === '0' ? 'text-emerald-400 bg-emerald-950/30' : 'text-rose-400 bg-rose-950/30'
                    }`}>
                      {typeVal === '0' ? 'BUY' : typeVal === '1' ? 'SELL' : typeVal}
                    </span>
                  </div>
                  <div className="text-right text-zinc-300 font-semibold">{volumeVal.toFixed(2)}</div>
                  <div className="text-right text-zinc-400">
                    {openPriceVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                  </div>
                  <div className="text-right text-zinc-200">
                    {currentPriceVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                  </div>
                  <div className={`text-right font-bold flex items-center justify-end gap-1.5 ${
                    isProfit ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    ${floatingPLVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Aggregate Footer Summary */}
        <div className={`grid grid-cols-7 p-3 border-t border-zinc-800 bg-zinc-900/40 font-bold tracking-wide items-center transition-opacity duration-300 ${connected ? 'opacity-100' : 'opacity-40'}`}>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider col-span-3">Composite Portfolio Exposure Summary</div>
          <div className="col-span-3 text-right text-zinc-400 text-[10px] uppercase tracking-wider">Total Net Margin Floating P/L:</div>
          <div className={`text-right text-sm ${totalPL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${totalPL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
}
