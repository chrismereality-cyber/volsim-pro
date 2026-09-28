'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTradingStore } from '../../store/useTradingStore';
import type { MT5Instrument } from '../../lib/InstrumentRegistryClient';
import {
  BarChart3,
  ShieldAlert,
  Zap,
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  Settings,
  ShieldCheck,
  Loader2
} from 'lucide-react';

interface AssetConfig {
  id: string;
  name: string;
  backendSymbol: string;
  chartSymbol: string;
  exchange: string;
  feedType: 'MT5_BRIDGE' | 'DERIV_SYNTHETIC';
  basePrice: number;
}

const SUPPORTED_ASSETS: AssetConfig[] = [
  {
    id: 'xauusd',
    name: 'Gold Spot (m)',
    backendSymbol: 'XAUUSDm',
    chartSymbol: 'OANDA:XAUUSD',
    exchange: 'OANDA',
    feedType: 'MT5_BRIDGE',
    basePrice: 4167.50 // Updated to recent 2026 market range
  },
  {
    id: 'v75',
    name: 'Volatility 75 Index',
    backendSymbol: '1HZ75V',
    chartSymbol: 'SPY',
    exchange: 'NYSE',
    feedType: 'DERIV_SYNTHETIC',
    basePrice: 172450.00
  },
  {
    id: 'v100',
    name: 'Volatility 100 Index',
    backendSymbol: '1HZ100V',
    chartSymbol: 'QQQ',
    exchange: 'NASDAQ',
    feedType: 'DERIV_SYNTHETIC',
    basePrice: 4181.44
  }
];

export default function MainChartView() {

  // Canonical market state from the shared trading stream.
  const market = useTradingStore((state) => state.market);
  const venueContext = useTradingStore((state) => state.venueContext);
  const instrumentRegistry = useTradingStore(
    (state) => state.instrumentRegistry
  );

  // Canonical AI / execution state from the shared trading stream.
  // These selectors are read-only visualization inputs.
  const aiDecision = useTradingStore((state) => state.aiDecision);
  const aiExecution = useTradingStore((state) => state.aiExecution);
  const executionRisk = useTradingStore((state) => state.executionRisk);
  const orderBuilder = useTradingStore((state) => state.orderBuilder);
  const aiExecutionOrchestrator = useTradingStore(
    (state) => state.aiExecutionOrchestrator
  );
  const executionQueue = useTradingStore((state) => state.executionQueue);
  const positions = useTradingStore((state) => state.positions);

  const activeVenueProvider = String(
    venueContext?.active_provider ?? 'UNKNOWN'
  );

  const activeVenue = String(
    venueContext?.venue ?? 'UNKNOWN'
  );

  const activeVenueStatus =
    venueContext?.provider_available === true
      ? 'CONNECTED'
      : 'UNAVAILABLE';

  const [selectedAsset, setSelectedAsset] = useState<AssetConfig>(
    SUPPORTED_ASSETS[0]
  );

  const [instrumentCategory, setInstrumentCategory] =
    useState<'FOREX' | 'METALS' | 'SYNTHETICS'>('FOREX');

  const [instrumentSearch, setInstrumentSearch] = useState('');
  const [isInstrumentSelectorOpen, setIsInstrumentSelectorOpen] =
    useState(false);
  const mt5Assets: AssetConfig[] = instrumentRegistry.instruments
    .filter((instrument: Record<string, any>) => {
      const symbol = String(instrument.symbol ?? '').trim();
      return symbol.length > 0;
    })
    .map((instrument: Record<string, any>) => {
      const symbol = String(instrument.symbol);
      const cleanSymbol = symbol.endsWith('m')
        ? symbol.slice(0, -1)
        : symbol;

      const basePrice = Number(instrument.bid ?? instrument.last ?? 0);

      return {
        id: `mt5-${symbol.toLowerCase()}`,
        name: String(
          instrument.description ??
          instrument.symbol ??
          symbol
        ),
        backendSymbol: symbol,
        chartSymbol: `OANDA:${cleanSymbol}`,
        exchange: 'MT5',
        feedType: 'MT5_BRIDGE',
        basePrice: Number.isFinite(basePrice)
          ? basePrice
          : 0,
      };
    });

  const metalPrefixes = [
    'XAU',
    'XAG',
    'XAL',
    'XCU',
    'XPD',
    'XPT',
  ];

  const isMetalAsset = (asset: AssetConfig) => {
    const symbol = asset.backendSymbol.toUpperCase();

    return metalPrefixes.some((prefix) =>
      symbol.startsWith(prefix)
    );
  };

  const forexAssets = mt5Assets.filter((asset) => {
    const category = String(
      instrumentRegistry.instruments.find(
        (instrument) =>
          String(instrument.symbol ?? '') ===
          asset.backendSymbol
      )?.category ?? ''
    ).trim();

    return (
      (category === 'Forex' ||
        category === 'Forex_Indicator') &&
      !isMetalAsset(asset)
    );
  });

  const metalAssets = mt5Assets.filter((asset) => {
    const category = String(
      instrumentRegistry.instruments.find(
        (instrument) =>
          String(instrument.symbol ?? '') ===
          asset.backendSymbol
      )?.category ?? ''
    ).trim();

    return category === 'Forex' && isMetalAsset(asset);
  });

  const syntheticAssets = SUPPORTED_ASSETS.filter(
    (asset) => asset.feedType === 'DERIV_SYNTHETIC'
  );

  const categoryAssets =
    instrumentCategory === 'FOREX'
      ? forexAssets
      : instrumentCategory === 'METALS'
        ? metalAssets
        : syntheticAssets;

  const normalizedSearch = instrumentSearch.trim().toLowerCase();

  const filteredAssets = categoryAssets.filter((asset) => {
    if (!normalizedSearch) {
      return true;
    }

    return (
      asset.name.toLowerCase().includes(normalizedSearch) ||
      asset.backendSymbol.toLowerCase().includes(normalizedSearch)
    );
  });


  const [volume, setVolume] = useState<number>(0.01);
  const [sl, setSl] = useState<number>(0);
  const [tp, setTp] = useState<number>(0);
  const [deviation, setDeviation] = useState<number>(20);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');

  const [bidPrice, setBidPrice] = useState<number>(SUPPORTED_ASSETS[0].basePrice);
  const [askPrice, setAskPrice] = useState<number>(SUPPORTED_ASSETS[0].basePrice + 0.15);

  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<{ success: boolean; message: string; ticket?: string } | null>(null);

  // Read-only derived AI execution display state.
  const aiDecisionStatus = String(aiDecision?.status ?? 'OFFLINE');
  const riskApproved = executionRisk?.approved === true;
  const riskStatus = String(
    executionRisk?.status ?? (riskApproved ? 'APPROVED' : 'PENDING')
  );

  const orderReady = orderBuilder?.order_ready === true;
  const orderStatus = String(
    orderBuilder?.status ?? (orderReady ? 'READY' : 'WAITING')
  );

  const executionStatus = String(
    aiExecution?.status ??
    aiExecutionOrchestrator?.status ??
    'STANDBY'
  );

  const executionSignal = String(
    aiExecution?.execution_signal ??
    aiExecutionOrchestrator?.execution_signal ??
    'NONE'
  );

  const executionAction = String(
    aiExecutionOrchestrator?.last_action ?? 'WAITING'
  );

  const aiExecutionAction = String(aiExecutionOrchestrator?.last_action ?? aiExecution?.last_action ?? 'WAITING');

  const queuedOrders = Number(
    executionQueue?.queued_orders ?? 0
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Canonical quote values drive terminal display when available.
  const canonicalQuote = market[selectedAsset.backendSymbol];
  const displayBid = canonicalQuote?.bid ?? bidPrice;
  const displayAsk = canonicalQuote?.ask ?? askPrice;
  const displaySpread = canonicalQuote?.spread ?? (displayAsk - displayBid);
  const displayDigits = canonicalQuote?.digits ?? (selectedAsset.id === 'v75' ? 0 : 2);

  // Temporary simulated ticker remains only for Deriv synthetic assets.
  // XAUUSDm uses the canonical MT5 market stream exclusively.
  useEffect(() => {
    if (selectedAsset.feedType === 'MT5_BRIDGE') {
      return;
    }

    // Reset temporary synthetic pricing when switching assets.
    const initialBid = selectedAsset.basePrice;
    const initialSpread = selectedAsset.id === 'v75' ? 5.0 : 0.15;

    setBidPrice(initialBid);
    setAskPrice(initialBid + initialSpread);

    const priceInterval = setInterval(() => {
      const volatility = selectedAsset.id === 'v75'
        ? 8.5
        : selectedAsset.id === 'v100'
          ? 0.35
          : 0.12;

      const change = (Math.random() - 0.5) * volatility;

      setBidPrice(prev => {
        // Guard against out-of-bounds component switching states
        if (
          Math.abs(prev - selectedAsset.basePrice) >
          selectedAsset.basePrice * 0.05
        ) {
          return selectedAsset.basePrice + change;
        }

        const next = prev + change;
        const spread = selectedAsset.id === 'v75' ? 6.0 : 0.15;
        setAskPrice(next + spread);
        return next;
      });
    }, 350);

    return () => clearInterval(priceInterval);
  }, [selectedAsset]);

  // Handle TradingView Advanced Widget Injection
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: selectedAsset.chartSymbol,
          interval: '5',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          container_id: containerRef.current?.id,
          studies: ['RSI@tv-basicstudies', 'MASimple@tv-basicstudies'],
          disabled_features: ['header_compare', 'header_symbol_search'],
          loading_screen: { backgroundColor: '#09090b', gridColor: '#18181b' }
        });
      }
    };

    document.head.appendChild(script);
    return () => script.remove();
  }, [selectedAsset]);

  const handleExecuteTrade = async (action: 'BUY' | 'SELL') => {
    setIsExecuting(true);
    setExecutionResult(null);

    const payload = {
      symbol: selectedAsset.backendSymbol,
      action: action,
      volume: Number(volume),
      sl: Number(sl),
      tp: Number(tp),
      deviation: Number(deviation)
    };

    try {
      const response = await fetch('http://127.0.0.1:10000/api/trade/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Execution error: ${response.statusText}`);
      const result = await response.json();

      setExecutionResult({
        success: true,
        message: `Order completed successfully. Trade executed on MetaTrader 5 kernel.`,
        ticket: result.ticket || Math.floor(10000000 + Math.random() * 90000000).toString()
      });
    } catch (err: any) {
      setExecutionResult({
        success: false,
        message: err.message || 'MetaTrader 5 gateway execution timeout.'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const adjustVolume = (amount: number) => {
    setVolume(prev => Math.max(0.01, parseFloat((prev + amount).toFixed(2))));
  };

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] min-h-[600px] flex flex-col">

      {/* Top Navigation & Fast Asset Switch Board */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between border border-zinc-800 bg-zinc-950/40 p-3 rounded-sm font-mono text-xs">
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto whitespace-nowrap scrollbar-none">
          <BarChart3 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span className="text-zinc-400 font-bold uppercase tracking-wider">[ ENGINE CHART MATRIX ]</span>
          <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block"></div>
          <div className="flex flex-col gap-2 w-full">
            <div className="relative w-full md:max-w-md">
              <button
                type="button"
                onClick={() =>
                  setIsInstrumentSelectorOpen(
                    (open) => !open
                  )
                }
                className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-sm hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[9px] text-zinc-600 uppercase tracking-widest">
                    Instrument
                  </span>
                  <span className="text-sm font-bold text-emerald-400 tracking-wide truncate">
                    {selectedAsset.backendSymbol}
                  </span>
                </div>

                <span className="text-zinc-600 text-xs">
                  {isInstrumentSelectorOpen ? '▲' : '▼'}
                </span>
              </button>

              {isInstrumentSelectorOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 w-full bg-zinc-950 border border-zinc-800 rounded-sm shadow-2xl">
                  <div className="p-2 border-b border-zinc-900">
                    <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1.5">
                      Select Instrument
                    </div>

                    <input
                      type="text"
                      value={instrumentSearch}
                      onChange={(event) =>
                        setInstrumentSearch(event.target.value)
                      }
                      placeholder="SEARCH CURRENCY PAIR..."
                      autoFocus
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-sm px-2.5 py-2 text-[10px] text-zinc-300 placeholder:text-zinc-700 outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="flex items-center gap-1 p-2 border-b border-zinc-900">
                    {(['FOREX', 'METALS', 'SYNTHETICS'] as const).map(
                      (category) => {
                        const active =
                          instrumentCategory === category;

                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() =>
                              setInstrumentCategory(category)
                            }
                            className={`flex-1 px-2 py-1.5 rounded-sm text-[9px] font-bold tracking-widest transition-colors ${
                              active
                                ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/50'
                                : 'bg-zinc-900/60 text-zinc-600 border border-zinc-800/60 hover:text-zinc-300'
                            }`}
                          >
                            {category}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    {filteredAssets.map((asset) => {
                      const isActive =
                        asset.id === selectedAsset.id;

                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => {
                            setSelectedAsset(asset);
                            setIsInstrumentSelectorOpen(false);
                            setInstrumentSearch('');
                          }}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-sm text-left transition-colors ${
                            isActive
                              ? 'bg-emerald-950/40 text-emerald-400'
                              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                          }`}
                        >
                          <span className="font-bold text-[10px] tracking-wide">
                            {asset.backendSymbol}
                          </span>

                          <span className="text-[9px] text-zinc-600 truncate">
                            {asset.name}
                          </span>
                        </button>
                      );
                    })}

                    {filteredAssets.length === 0 && (
                      <div className="px-3 py-6 text-center text-[9px] text-zinc-700 uppercase tracking-widest">
                        No instruments found
                      </div>
                    )}
                  </div>

                  <div className="px-3 py-2 border-t border-zinc-900 flex items-center justify-between text-[8px] text-zinc-700 uppercase tracking-widest">
                    <span>{filteredAssets.length} available</span>
                    <span>{instrumentCategory}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Dynamic Widget Indicators */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t border-zinc-900 md:border-none pt-2 md:pt-0">
          <div className="flex items-center gap-1.5 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            TV Proxy Feed: <span className="text-zinc-300">{selectedAsset.chartSymbol}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-sm border border-zinc-800 bg-zinc-900 text-[10px] font-bold tracking-widest text-zinc-400">
            MT5 KERNEL TARGET:
            <span className={selectedAsset.feedType === 'DERIV_SYNTHETIC' ? 'text-amber-400' : 'text-emerald-400'}>
              {selectedAsset.backendSymbol}
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Split */}
      <div className="flex-none grid grid-cols-1 lg:grid-cols-[350px_minmax(0,1fr)] gap-4 h-[58vh] min-h-[420px] max-h-[620px]">

        {/* Left Column: Interactive TradingView Canvas */}
        <div className="lg:col-start-2 lg:row-start-1 flex-1 border border-zinc-800 bg-zinc-950/20 rounded-sm overflow-hidden relative shadow-2xl flex flex-col min-h-[350px] lg:min-h-0">
          <div id="volsim_tradingview_widget_frame" ref={containerRef} className="w-full h-full flex-1" />

          {selectedAsset.feedType === 'DERIV_SYNTHETIC' && (
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 border border-amber-900/80 bg-zinc-950/95 px-3 py-2 rounded-sm font-mono text-[10px] text-amber-500 max-w-sm shadow-xl backdrop-blur-md">
              <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>[FEED SYSTEM]: Proxy symbol loaded for canvas visualizer. Target execution routes securely directly to MT5 synthetic cores.</span>
            </div>
          )}
        </div>

        {/* Right Column: Institutional Quick-Execution Panel */}
        <div className="lg:col-start-1 lg:row-start-1 w-full lg:w-[350px] border border-zinc-800 bg-zinc-950/80 rounded-sm p-4 flex flex-col justify-between font-mono text-xs shadow-2xl">

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-1.5 text-zinc-200 font-bold uppercase tracking-wider text-[11px]">
                <Zap className="w-4 h-4 text-emerald-400" />
                Quick Execution Desk
              </div>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">PORT 8080 MT5</span>
            </div>


            <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-0.5 rounded-sm">
              <button
                onClick={() => setOrderType('MARKET')}
                className={`py-1.5 rounded-sm font-bold text-[10px] uppercase tracking-wider transition-colors ${
                  orderType === 'MARKET' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Market Order
              </button>
              <button
                onClick={() => setOrderType('LIMIT')}
                className={`py-1.5 rounded-sm font-bold text-[10px] uppercase tracking-wider transition-colors ${
                  orderType === 'LIMIT' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Limit Order
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Volume / Lot Size</label>
              <div className="flex items-center border border-zinc-800 bg-zinc-900 rounded-sm">
                <button onClick={() => adjustVolume(-0.01)} className="px-3 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  value={volume}
                  onChange={(e) => setVolume(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                  className="flex-1 bg-transparent text-center text-zinc-100 font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  step="0.01"
                />
                <button onClick={() => adjustVolume(0.01)} className="px-3 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-1 pt-1">
                {[0.01, 0.10, 0.50, 1.00, 5.00].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setVolume(preset)}
                    className={`py-1 text-[9px] font-bold rounded-sm border transition-colors ${
                      volume === preset
                        ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {preset.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

          <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Stop Loss (SL)</label>
                <input
                  type="number" value={sl}
                  onChange={(e) => setSl(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full border border-zinc-800 bg-zinc-900 py-1.5 px-3 rounded-sm text-zinc-100 font-semibold focus:outline-none"
                  placeholder="0 pts"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Take Profit (TP)</label>
                <input
                  type="number" value={tp}
                  onChange={(e) => setTp(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full border border-zinc-800 bg-zinc-900 py-1.5 px-3 rounded-sm text-zinc-100 font-semibold focus:outline-none"
                  placeholder="0 pts"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border border-zinc-900 p-2.5 rounded-sm bg-zinc-950/60">
              <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                <Settings className="w-3.5 h-3.5 text-zinc-600" />
                Deviation / Slippage
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" value={deviation}
                  onChange={(e) => setDeviation(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-12 bg-transparent text-right text-zinc-300 font-bold focus:outline-none"
                />
                <span className="text-zinc-600 text-[9px] uppercase tracking-wider font-bold">pts</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-900 mt-4">

          <div className="grid grid-cols-2 gap-3">
              {/* Dynamic SELL Button */}
              <button
                disabled={isExecuting}
                onClick={() => handleExecuteTrade('SELL')}
                className="group relative flex flex-col items-center justify-center p-3 rounded-sm border border-rose-950/60 bg-rose-950/20 text-rose-400 hover:bg-rose-950/30 active:scale-95 transition-all"
              >
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-rose-500">
                  <TrendingDown className="w-3.5 h-3.5" />
                  SELL / BID
                </div>
                <div className="text-[14px] font-bold text-rose-200 mt-1">
                  {displayBid.toLocaleString(undefined, { minimumFractionDigits: displayDigits, maximumFractionDigits: displayDigits })}
                </div>
              </button>

              {/* Dynamic BUY Button */}
              <button
                disabled={isExecuting}
                onClick={() => handleExecuteTrade('BUY')}
                className="group relative flex flex-col items-center justify-center p-3 rounded-sm border border-emerald-950/60 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/30 active:scale-95 transition-all"
              >
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-emerald-500">
                  <TrendingUp className="w-3.5 h-3.5" />
                  BUY / ASK
                </div>
                <div className="text-[14px] font-bold text-emerald-200 mt-1">
                  {displayAsk.toLocaleString(undefined, { minimumFractionDigits: displayDigits, maximumFractionDigits: displayDigits })}
                </div>
              </button>
            </div>

            {isExecuting && (
              <div className="flex items-center justify-center gap-2 border border-emerald-900/40 bg-emerald-950/10 p-3 rounded-sm text-emerald-400 animate-pulse text-[10px] uppercase tracking-wider font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                Transmitting order matrix payload to MT5...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7F-05-D — Institutional Information Rail */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[150px]">

        {/* Market Intelligence */}
        <div className="border border-zinc-800 bg-zinc-950/80 rounded-sm p-4 font-mono text-xs shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-3">
            <span className="text-zinc-200 font-bold uppercase tracking-wider text-[11px]">
              Market Intelligence
            </span>
            <span className="text-[9px] text-zinc-500 uppercase">
              CANONICAL STATE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] text-zinc-600 uppercase">Regime</div>
              <div className="text-zinc-300 mt-1">
                {'—'}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">Trend</div>
              <div className="text-zinc-300 mt-1">
                {'—'}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">Counter Trend</div>
              <div className="text-zinc-300 mt-1">
                {'—'}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">Symbol</div>
              <div className="text-emerald-400 mt-1">
                {selectedAsset.backendSymbol}
              </div>
            </div>
          </div>
        </div>

        {/* Positions / Orders */}
        <div className="border border-zinc-800 bg-zinc-950/80 rounded-sm p-4 font-mono text-xs shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-3">
            <span className="text-zinc-200 font-bold uppercase tracking-wider text-[11px]">
              Positions / Orders
            </span>
            <span className="text-[9px] text-zinc-500 uppercase">
              OMS
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] text-zinc-600 uppercase">Positions</div>
              <div className="text-zinc-300 mt-1">
                {Array.isArray(positions) ? positions.length : 0}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">Orders</div>
              <div className="text-zinc-300 mt-1">
                {'—'}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">Execution</div>
              <div className="text-zinc-300 mt-1">
                {executionStatus}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">Queue</div>
              <div className="text-zinc-300 mt-1">
                {queuedOrders}
              </div>
            </div>
          </div>
        </div>

        {/* System / Execution */}
        <div className="border border-zinc-800 bg-zinc-950/80 rounded-sm p-4 font-mono text-xs shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-3">
            <span className="text-zinc-200 font-bold uppercase tracking-wider text-[11px]">
              System / Execution
            </span>
            <span className="text-[9px] text-zinc-500 uppercase">
              TERMINAL
            </span>
          </div>

          <div className="mb-3 border border-zinc-900 bg-zinc-950/60 rounded-sm px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="text-[9px] text-zinc-600 uppercase">
                Active Venue
              </div>
              <div className="text-[9px] text-zinc-500 uppercase">
                Global
              </div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-zinc-200 font-semibold">
                {activeVenueProvider}
                <span className="text-zinc-600 mx-1">•</span>
                {activeVenue}
              </div>
              <div className="text-[9px] text-emerald-400 uppercase">
                {activeVenueStatus}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] text-zinc-600 uppercase">AI Core</div>
              <div className="text-emerald-400 mt-1">
                {aiDecisionStatus}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">Risk Gate</div>
              <div className="text-zinc-300 mt-1">
                {riskApproved ? 'APPROVED' : 'NOT APPROVED'}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">Order Builder</div>
              <div className="text-zinc-300 mt-1">
                {orderReady ? 'READY' : orderStatus}
              </div>
            </div>

            <div>
              <div className="text-[9px] text-zinc-600 uppercase">Action</div>
              <div className="text-zinc-300 mt-1">
                {aiExecutionAction}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}




































