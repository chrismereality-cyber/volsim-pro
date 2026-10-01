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
  Loader2,
  Activity,
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
    basePrice: 4167.50
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
  const market = useTradingStore((state) => state.market);
  const venueContext = useTradingStore((state) => state.venueContext);
  const instrumentRegistry = useTradingStore(
    (state) => state.instrumentRegistry
  );

  const aiDecision = useTradingStore((state) => state.aiDecision);
  const aiExecution = useTradingStore((state) => state.aiExecution);
  const executionRisk = useTradingStore((state) => state.executionRisk);
  const orderBuilder = useTradingStore((state) => state.orderBuilder);
  const aiExecutionOrchestrator = useTradingStore(
    (state) => state.aiExecutionOrchestrator
  );
  const executionQueue = useTradingStore((state) => state.executionQueue);
  const positions = useTradingStore((state) => state.positions);

  const marketRegimeBySymbol = useTradingStore(
    (state) => state.marketRegimeBySymbol
  );

  const trendBySymbol = useTradingStore(
    (state) => state.trendBySymbol
  );

  const counterTrendBySymbol = useTradingStore(
    (state) => state.counterTrendBySymbol
  );

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

  const [bidPrice, setBidPrice] = useState<number>(
    SUPPORTED_ASSETS[0].basePrice
  );

  const [askPrice, setAskPrice] = useState<number>(
    SUPPORTED_ASSETS[0].basePrice + 0.15
  );

  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    message: string;
    ticket?: string;
  } | null>(null);

  const selectedSymbol = selectedAsset.backendSymbol;

  const selectedMarketRegime =
    marketRegimeBySymbol[selectedSymbol];

  const selectedTrend =
    trendBySymbol[selectedSymbol];

  const selectedCounterTrend =
    counterTrendBySymbol[selectedSymbol];

  const aiDecisionStatus = String(aiDecision?.status ?? 'OFFLINE');

  const riskApproved = executionRisk?.approved === true;

  const riskStatus = String(
    executionRisk?.status ??
    (riskApproved ? 'APPROVED' : 'PENDING')
  );

  const orderReady = orderBuilder?.order_ready === true;

  const orderStatus = String(
    orderBuilder?.status ??
    (orderReady ? 'READY' : 'WAITING')
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

  const aiExecutionAction = String(
    aiExecutionOrchestrator?.last_action ??
    aiExecution?.last_action ??
    'WAITING'
  );

  const queuedOrders = Number(
    executionQueue?.queued_orders ?? 0
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const canonicalQuote = market[selectedAsset.backendSymbol];

  const displayBid =
    canonicalQuote?.bid ?? bidPrice;

  const displayAsk =
    canonicalQuote?.ask ?? askPrice;

  const displaySpread =
    canonicalQuote?.spread ??
    (displayAsk - displayBid);

  const displayDigits =
    canonicalQuote?.digits ??
    (selectedAsset.id === 'v75' ? 0 : 2);

  useEffect(() => {
    if (selectedAsset.feedType === 'MT5_BRIDGE') {
      return;
    }

    const initialBid = selectedAsset.basePrice;

    const initialSpread =
      selectedAsset.id === 'v75'
        ? 5.0
        : 0.15;

    setBidPrice(initialBid);
    setAskPrice(initialBid + initialSpread);

    const priceInterval = setInterval(() => {
      const volatility =
        selectedAsset.id === 'v75'
          ? 8.5
          : selectedAsset.id === 'v100'
            ? 0.35
            : 0.12;

      const change =
        (Math.random() - 0.5) * volatility;

      setBidPrice(prev => {
        if (
          Math.abs(prev - selectedAsset.basePrice) >
          selectedAsset.basePrice * 0.05
        ) {
          return selectedAsset.basePrice + change;
        }

        const next = prev + change;

        const spread =
          selectedAsset.id === 'v75'
            ? 6.0
            : 0.15;

        setAskPrice(next + spread);

        return next;
      });
    }, 350);

    return () => clearInterval(priceInterval);
  }, [selectedAsset]);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';

    const script = document.createElement('script');

    script.src = 'https://s3.tradingview.com/tv.js';
    script.type = 'text/javascript';
    script.async = true;

    script.onload = () => {
      if (
        typeof window !== 'undefined' &&
        (window as any).TradingView
      ) {
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
          studies: [
            'RSI@tv-basicstudies',
            'MASimple@tv-basicstudies'
          ],
          disabled_features: [
            'header_compare',
            'header_symbol_search'
          ],
          loading_screen: {
            backgroundColor: '#09090b',
            gridColor: '#18181b'
          }
        });
      }
    };

    document.head.appendChild(script);

    return () => script.remove();
  }, [selectedAsset]);

  const handleExecuteTrade = async (
    action: 'BUY' | 'SELL'
  ) => {
    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const response = await fetch(
        `http://127.0.0.1:10000/api/trading/execute/${encodeURIComponent(
          selectedAsset.backendSymbol
        )}`,
        {
          method: 'POST',
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail ||
          result.last_action ||
          `Execution error: ${response.statusText}`
        );
      }

      const status = String(
        result.status ?? 'UNKNOWN'
      );

      const orchestrator =
        result.ai_execution_orchestrator ?? {};

      const lastAction = String(
        orchestrator.last_action ??
        result.last_action ??
        'UNKNOWN'
      );

      const ticket =
        result.ticket ??
        orchestrator.ticket ??
        orchestrator.order_ticket ??
        orchestrator.last_result?.ticket ??
        orchestrator.last_result?.order_ticket;

      const executionSucceeded =
        lastAction === 'ORDER_SENT';

      setExecutionResult({
        success: executionSucceeded,
        message:
          `${selectedAsset.backendSymbol} · ` +
          `${action} request → ` +
          `${status} · ` +
          `${lastAction}`,
        ...(ticket
          ? { ticket: String(ticket) }
          : {}),
      });
    } catch (err: any) {
      setExecutionResult({
        success: false,
        message:
          err.message ||
          'AI execution cycle request failed.'
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const adjustVolume = (amount: number) => {
    setVolume(prev =>
      Math.max(
        0.01,
        parseFloat(
          (prev + amount).toFixed(2)
        )
      )
    );
  };

  return (
    <div className="telemetry-shell space-y-4 h-[calc(100vh-140px)] min-h-[600px] flex flex-col">

      {/* TERMINAL HEADER */}
      <div className="telemetry-card overflow-visible relative z-30">

        <div className="p-4">

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

            <div className="flex items-center gap-3 min-w-0">

              <div className="flex items-center justify-center w-10 h-10 border border-emerald-500/30 bg-emerald-950/20 shrink-0">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="min-w-0">
                <div className="telemetry-label mb-1">
                  VOLSIM-PRO / TRADING TERMINAL
                </div>

                <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                  MARKET EXECUTION CHART
                </h1>
              </div>

            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-800/70">

              <div className="bg-zinc-950 px-4 py-2.5 min-w-[120px]">
                <div className="telemetry-label">
                  BID
                </div>

                <div className="text-lg font-black text-emerald-400 mt-1">
                  {displayBid.toLocaleString(undefined, {
                    minimumFractionDigits: displayDigits,
                    maximumFractionDigits: displayDigits
                  })}
                </div>
              </div>

              <div className="bg-zinc-950 px-4 py-2.5 min-w-[120px]">
                <div className="telemetry-label">
                  ASK
                </div>

                <div className="text-lg font-black text-rose-400 mt-1">
                  {displayAsk.toLocaleString(undefined, {
                    minimumFractionDigits: displayDigits,
                    maximumFractionDigits: displayDigits
                  })}
                </div>
              </div>

              <div className="bg-zinc-950 px-4 py-2.5 min-w-[120px]">
                <div className="telemetry-label">
                  SPREAD
                </div>

                <div className="text-lg font-black text-white mt-1">
                  {displaySpread.toLocaleString(undefined, {
                    minimumFractionDigits: displayDigits,
                    maximumFractionDigits: displayDigits
                  })}
                </div>
              </div>

              <div className="bg-zinc-950 px-4 py-2.5 min-w-[120px]">
                <div className="telemetry-label">
                  FEED
                </div>

                <div className={`text-lg font-black mt-1 ${
                  selectedAsset.feedType === 'DERIV_SYNTHETIC'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {selectedAsset.feedType === 'DERIV_SYNTHETIC'
                    ? 'SYNTH'
                    : 'MT5'}
                </div>
              </div>

            </div>

          </div>
        </div>

        <div className="telemetry-divider" />

        <div className="px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

          <div className="relative w-full lg:max-w-md">

            <button
              type="button"
              onClick={() =>
                setIsInstrumentSelectorOpen(
                  open => !open
                )
              }
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 transition-colors"
            >

              <div className="flex items-center gap-3 min-w-0">

                <span className="telemetry-label">
                  INSTRUMENT
                </span>

                <span className="text-sm font-black text-emerald-400 tracking-wide truncate">
                  {selectedAsset.backendSymbol}
                </span>

              </div>

              <span className="text-zinc-600 text-xs">
                {isInstrumentSelectorOpen ? '▲' : '▼'}
              </span>

            </button>

            {isInstrumentSelectorOpen && (
              <div className="absolute left-0 top-full mt-1 z-50 w-full bg-zinc-950 border border-zinc-800 shadow-2xl">

                <div className="p-2 border-b border-zinc-900">

                  <div className="telemetry-label mb-1.5">
                    SELECT INSTRUMENT
                  </div>

                  <input
                    type="text"
                    value={instrumentSearch}
                    onChange={event =>
                      setInstrumentSearch(
                        event.target.value
                      )
                    }
                    placeholder="SEARCH CURRENCY PAIR..."
                    autoFocus
                    className="w-full bg-zinc-900 border border-zinc-800 px-2.5 py-2 text-[10px] text-zinc-300 placeholder:text-zinc-700 outline-none focus:border-emerald-500/50"
                  />

                </div>

                <div className="flex items-center gap-1 p-2 border-b border-zinc-900">

                  {(
                    [
                      'FOREX',
                      'METALS',
                      'SYNTHETICS'
                    ] as const
                  ).map(category => {

                    const active =
                      instrumentCategory === category;

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() =>
                          setInstrumentCategory(
                            category
                          )
                        }
                        className={`flex-1 px-2 py-1.5 text-[9px] font-black tracking-widest transition-colors ${
                          active
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/50'
                            : 'bg-zinc-900/60 text-zinc-600 border border-zinc-800/60 hover:text-zinc-300'
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}

                </div>

                <div className="max-h-72 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-zinc-800">

                  {filteredAssets.map(asset => {

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
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors ${
                          isActive
                            ? 'bg-emerald-950/40 text-emerald-400'
                            : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                        }`}
                      >
                        <span className="font-black text-[10px] tracking-wide">
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

          <div className="flex flex-wrap items-center gap-3">

            <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-black uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              TV PROXY
              <span className="text-zinc-300">
                {selectedAsset.chartSymbol}
              </span>
            </div>

            <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

            <div className="text-[9px] font-black tracking-widest uppercase text-zinc-500">
              MT5 TARGET:
              <span className={
                selectedAsset.feedType === 'DERIV_SYNTHETIC'
                  ? 'text-amber-400 ml-1'
                  : 'text-emerald-400 ml-1'
              }>
                {selectedAsset.backendSymbol}
              </span>
            </div>

          </div>

        </div>
      </div>

      {/* MAIN WORKSPACE */}
      <div className="flex-none grid grid-cols-1 lg:grid-cols-[350px_minmax(0,1fr)] gap-4 h-[58vh] min-h-[420px] max-h-[620px]">

        {/* CHART */}
        <div className="lg:col-start-2 lg:row-start-1 flex-1 border border-zinc-800 bg-zinc-950/20 overflow-hidden relative shadow-2xl flex flex-col min-h-[350px] lg:min-h-0">

          <div className="absolute top-0 left-0 right-0 z-10 px-3 py-2 bg-zinc-950/75 border-b border-zinc-900 pointer-events-none">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />

                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                  {selectedAsset.backendSymbol}
                </span>

                <span className="text-[9px] text-zinc-700">
                  / 5M
                </span>
              </div>

              <div className="text-[8px] text-zinc-600 uppercase tracking-widest">
                TradingView Canvas
              </div>

            </div>

          </div>

          <div
            id="volsim_tradingview_widget_frame"
            ref={containerRef}
            className="w-full h-full flex-1"
          />

          {selectedAsset.feedType === 'DERIV_SYNTHETIC' && (
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 border border-amber-900/80 bg-zinc-950/95 px-3 py-2 font-mono text-[10px] text-amber-500 max-w-sm shadow-xl backdrop-blur-md">

              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />

              <span>
                Proxy symbol loaded for canvas visualization.
                Execution target remains:
                {` ${selectedAsset.backendSymbol}`}
              </span>

            </div>
          )}

        </div>

        {/* EXECUTION DESK */}
        <div className="lg:col-start-1 lg:row-start-1 w-full lg:w-[350px] border border-zinc-800 bg-zinc-950/95 p-4 flex flex-col justify-between font-mono text-xs shadow-2xl">

          <div className="space-y-4">

            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">

              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />

                  <span className="text-white font-black uppercase tracking-wider text-[11px]">
                    Execution Desk
                  </span>
                </div>

                <div className="text-[8px] text-zinc-600 uppercase tracking-widest mt-1">
                  Order construction interface
                </div>
              </div>

              <span className="text-[9px] text-zinc-600 uppercase tracking-widest">
                MT5
              </span>

            </div>

            <div className="grid grid-cols-2 gap-px bg-zinc-800">

              <button
                onClick={() =>
                  setOrderType('MARKET')
                }
                className={`py-2 font-black text-[9px] uppercase tracking-widest transition-colors ${
                  orderType === 'MARKET'
                    ? 'bg-zinc-800 text-emerald-400'
                    : 'bg-zinc-950 text-zinc-600 hover:text-zinc-300'
                }`}
              >
                Market
              </button>

              <button
                onClick={() =>
                  setOrderType('LIMIT')
                }
                className={`py-2 font-black text-[9px] uppercase tracking-widest transition-colors ${
                  orderType === 'LIMIT'
                    ? 'bg-zinc-800 text-emerald-400'
                    : 'bg-zinc-950 text-zinc-600 hover:text-zinc-300'
                }`}
              >
                Limit
              </button>

            </div>

            <div className="space-y-2">

              <label className="telemetry-label">
                Volume / Lot Size
              </label>

              <div className="flex items-center border border-zinc-800 bg-zinc-900">

                <button
                  onClick={() => adjustVolume(-0.01)}
                  className="px-3 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                <input
                  type="number"
                  value={volume}
                  onChange={e =>
                    setVolume(
                      Math.max(
                        0.01,
                        parseFloat(e.target.value) ||
                        0.01
                      )
                    )
                  }
                  className="flex-1 bg-transparent text-center text-white font-black focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  step="0.01"
                />

                <button
                  onClick={() => adjustVolume(0.01)}
                  className="px-3 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>

              </div>

              <div className="grid grid-cols-5 gap-1">

                {[0.01, 0.10, 0.50, 1.00, 5.00].map(
                  preset => (
                    <button
                      key={preset}
                      onClick={() =>
                        setVolume(preset)
                      }
                      className={`py-1.5 text-[8px] font-black border transition-colors ${
                        volume === preset
                          ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-400'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      {preset.toFixed(2)}
                    </button>
                  )
                )}

              </div>

            </div>

            <div className="grid grid-cols-2 gap-3">

              <div className="space-y-1.5">
                <label className="telemetry-label">
                  Stop Loss
                </label>

                <input
                  type="number"
                  value={sl}
                  onChange={e =>
                    setSl(
                      Math.max(
                        0,
                        parseInt(e.target.value) || 0
                      )
                    )
                  }
                  className="w-full border border-zinc-800 bg-zinc-900 py-2 px-3 text-zinc-100 font-bold focus:outline-none"
                  placeholder="0 pts"
                />
              </div>

              <div className="space-y-1.5">
                <label className="telemetry-label">
                  Take Profit
                </label>

                <input
                  type="number"
                  value={tp}
                  onChange={e =>
                    setTp(
                      Math.max(
                        0,
                        parseInt(e.target.value) || 0
                      )
                    )
                  }
                  className="w-full border border-zinc-800 bg-zinc-900 py-2 px-3 text-zinc-100 font-bold focus:outline-none"
                  placeholder="0 pts"
                />
              </div>

            </div>

            <div className="flex items-center justify-between border border-zinc-900 p-2.5 bg-zinc-950/60">

              <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 uppercase tracking-widest font-black">
                <Settings className="w-3.5 h-3.5 text-zinc-600" />
                Slippage
              </div>

              <div className="flex items-center gap-1.5">

                <input
                  type="number"
                  value={deviation}
                  onChange={e =>
                    setDeviation(
                      Math.max(
                        0,
                        parseInt(e.target.value) || 0
                      )
                    )
                  }
                  className="w-12 bg-transparent text-right text-zinc-300 font-black focus:outline-none"
                />

                <span className="text-zinc-600 text-[8px] uppercase tracking-wider font-black">
                  pts
                </span>

              </div>

            </div>

          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-900 mt-4">

            <div className="grid grid-cols-2 gap-2">

              <button
                disabled={isExecuting}
                onClick={() =>
                  handleExecuteTrade('SELL')
                }
                className="flex flex-col items-center justify-center p-3 border border-rose-900/60 bg-rose-950/20 text-rose-400 hover:bg-rose-950/35 active:scale-[0.98] transition-all"
              >

                <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-black">
                  <TrendingDown className="w-3.5 h-3.5" />
                  SELL / BID
                </div>

                <div className="text-base font-black text-rose-200 mt-1">
                  {displayBid.toLocaleString(undefined, {
                    minimumFractionDigits: displayDigits,
                    maximumFractionDigits: displayDigits
                  })}
                </div>

              </button>

              <button
                disabled={isExecuting}
                onClick={() =>
                  handleExecuteTrade('BUY')
                }
                className="flex flex-col items-center justify-center p-3 border border-emerald-900/60 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/35 active:scale-[0.98] transition-all"
              >

                <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-black">
                  <TrendingUp className="w-3.5 h-3.5" />
                  BUY / ASK
                </div>

                <div className="text-base font-black text-emerald-200 mt-1">
                  {displayAsk.toLocaleString(undefined, {
                    minimumFractionDigits: displayDigits,
                    maximumFractionDigits: displayDigits
                  })}
                </div>

              </button>

            </div>

            {isExecuting && (
              <div className="flex items-center justify-center gap-2 border border-emerald-900/40 bg-emerald-950/10 p-3 text-emerald-400 animate-pulse text-[9px] uppercase tracking-wider font-black">
                <Loader2 className="w-4 h-4 animate-spin" />
                Transmitting order matrix payload...
              </div>
            )}

            {executionResult && (
              <div className={`border p-2.5 text-[9px] uppercase tracking-wider ${
                executionResult.success
                  ? 'border-emerald-900/40 bg-emerald-950/10 text-emerald-400'
                  : 'border-rose-900/40 bg-rose-950/10 text-rose-400'
              }`}>
                {executionResult.message}
                {executionResult.ticket && (
                  <div className="mt-1 font-black">
                    TICKET: {executionResult.ticket}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* EXECUTION / INTELLIGENCE RAIL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[150px]">

        {/* MARKET INTELLIGENCE */}
        <div className="telemetry-card p-4">

          <div className="telemetry-card-header">
            <div>
              <div className="telemetry-section">
                MARKET INTELLIGENCE
              </div>

              <div className="text-[8px] text-zinc-600 uppercase tracking-widest mt-1">
                Canonical state
              </div>
            </div>

            <ShieldCheck className="w-4 h-4 text-zinc-600" />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">

            <div>
              <div className="telemetry-label">
                Regime
              </div>
              <div className="telemetry-value-md mt-1">
                {String(selectedMarketRegime ?? '—')}
              </div>
            </div>

            <div>
              <div className="telemetry-label">
                Trend
              </div>
              <div className="telemetry-value-md mt-1">
                {String(selectedTrend ?? '—')}
              </div>
            </div>

            <div>
              <div className="telemetry-label">
                Counter Trend
              </div>
              <div className="telemetry-value-md mt-1">
                {String(selectedCounterTrend ?? '—')}
              </div>
            </div>

            <div>
              <div className="telemetry-label">
                Symbol
              </div>
              <div className="telemetry-value-md telemetry-accent mt-1">
                {selectedAsset.backendSymbol}
              </div>
            </div>

          </div>

        </div>

        {/* OMS */}
        <div className="telemetry-card p-4">

          <div className="telemetry-card-header">

            <div>
              <div className="telemetry-section">
                POSITIONS / ORDERS
              </div>

              <div className="text-[8px] text-zinc-600 uppercase tracking-widest mt-1">
                Order management state
              </div>
            </div>

            <span className="telemetry-status telemetry-status-neutral">
              OMS
            </span>

          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">

            <div>
              <div className="telemetry-label">
                Positions
              </div>
              <div className="telemetry-value-lg mt-1">
                {Array.isArray(positions)
                  ? positions.length
                  : 0}
              </div>
            </div>

            <div>
              <div className="telemetry-label">
                Queue
              </div>
              <div className="telemetry-value-lg mt-1">
                {queuedOrders}
              </div>
            </div>

            <div>
              <div className="telemetry-label">
                Execution
              </div>
              <div className="text-sm font-black text-zinc-200 mt-1 uppercase">
                {executionStatus}
              </div>
            </div>

            <div>
              <div className="telemetry-label">
                Signal
              </div>
              <div className="text-sm font-black text-emerald-400 mt-1 uppercase">
                {executionSignal}
              </div>
            </div>

          </div>

        </div>

        {/* SYSTEM / EXECUTION */}
        <div className="telemetry-card p-4">

          <div className="telemetry-card-header">

            <div>
              <div className="telemetry-section">
                SYSTEM / EXECUTION
              </div>

              <div className="text-[8px] text-zinc-600 uppercase tracking-widest mt-1">
                Neural execution telemetry
              </div>
            </div>

            <Activity className="w-4 h-4 text-emerald-400" />

          </div>

          <div className="mt-3 border border-zinc-900 bg-zinc-950/60 px-3 py-2.5">

            <div className="flex items-center justify-between">

              <div className="telemetry-label">
                ACTIVE VENUE
              </div>

              <div className={`text-[8px] font-black uppercase ${
                activeVenueStatus === 'CONNECTED'
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}>
                {activeVenueStatus}
              </div>

            </div>

            <div className="text-zinc-200 font-black text-sm mt-1 uppercase">
              {activeVenueProvider}
              <span className="text-zinc-700 mx-1">
                •
              </span>
              {activeVenue}
            </div>

          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">

            <div>
              <div className="telemetry-label">
                AI CORE
              </div>

              <div className="text-emerald-400 font-black text-xs mt-1 uppercase">
                {aiDecisionStatus}
              </div>
            </div>

            <div>
              <div className="telemetry-label">
                RISK GATE
              </div>

              <div className={`font-black text-xs mt-1 uppercase ${
                riskApproved
                  ? 'text-emerald-400'
                  : 'text-amber-400'
              }`}>
                {riskStatus}
              </div>
            </div>

            <div>
              <div className="telemetry-label">
                ORDER BUILDER
              </div>

              <div className="text-zinc-200 font-black text-xs mt-1 uppercase">
                {orderReady
                  ? 'READY'
                  : orderStatus}
              </div>
            </div>

            <div>
              <div className="telemetry-label">
                ACTION
              </div>

              <div className="text-zinc-300 font-black text-xs mt-1 uppercase">
                {aiExecutionAction}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
