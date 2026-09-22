"use client";

import React, {
  createContext,
  useContext,
  useMemo,
} from "react";

import { useTradingStore } from "../../store/useTradingStore";

export interface GlobalStateContextValue {
  globalState: Record<string, any> & {
    portfolio?: Record<string, any>;
    risk?: Record<string, any>;
  };
  state: Record<string, any> & {
    portfolio?: Record<string, any>;
    risk?: Record<string, any>;
  };
  sockets: Record<string, WebSocket | null>;
  connected: boolean;
  connectionState: string;
}

const GlobalStateContext =
  createContext<GlobalStateContextValue | null>(null);

export const GlobalStateProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const connected = useTradingStore(
    (state) => state.connected
  );

  const balance = useTradingStore(
    (state) => state.balance
  );

  const equity = useTradingStore(
    (state) => state.equity
  );

  const floatingPl = useTradingStore(
    (state) => state.floatingPl
  );

  const positions = useTradingStore(
    (state) => state.positions
  );

  const currentDrawdown = useTradingStore(
    (state) => state.currentDrawdown
  );

  const maxDrawdown = useTradingStore(
    (state) => state.maxDrawdown
  );

  const riskPerTrade = useTradingStore(
    (state) => state.riskPerTrade
  );

  const marginUsage = useTradingStore(
    (state) => state.marginUsage
  );

  const netExposure = useTradingStore(
    (state) => state.netExposure
  );

  const valueAtRisk = useTradingStore(
    (state) => state.valueAtRisk
  );

  const riskStatus = useTradingStore(
    (state) => state.riskStatus
  );

  const liquidationWarning = useTradingStore(
    (state) => state.liquidationWarning
  );

  const portfolioValue = useTradingStore(
    (state) => state.portfolioValue
  );

  const winRate = useTradingStore(
    (state) => state.winRate
  );

  const profitFactor = useTradingStore(
    (state) => state.profitFactor
  );

  const expectancy = useTradingStore(
    (state) => state.expectancy
  );

  const sharpeRatio = useTradingStore(
    (state) => state.sharpeRatio
  );

  const totalTrades = useTradingStore(
    (state) => state.totalTrades
  );

  const hedgingSignals = useTradingStore(
    (state) => state.hedgingSignals
  );

  const globalState = useMemo(
    () => ({
      balance,
      equity,
      floatingPl,
      positions,
      currentDrawdown,
      maxDrawdown,
      riskPerTrade,
      marginUsage,
      netExposure,
      valueAtRisk,
      riskStatus,
      liquidationWarning,
      portfolioValue,
      winRate,
      profitFactor,
      expectancy,
      sharpeRatio,
      totalTrades,
      hedgingSignals,
    }),
    [
      balance,
      equity,
      floatingPl,
      positions,
      currentDrawdown,
      maxDrawdown,
      riskPerTrade,
      marginUsage,
      netExposure,
      valueAtRisk,
      riskStatus,
      liquidationWarning,
      portfolioValue,
      winRate,
      profitFactor,
      expectancy,
      sharpeRatio,
      totalTrades,
      hedgingSignals,
    ]
  );

  const value = useMemo<GlobalStateContextValue>(
    () => ({
      globalState,
      state: globalState,

      /*
       * WebSocket ownership has moved to TradingStateBridge.
       *
       * Legacy components may still expect this property.
       * They must not create or replace the socket themselves.
       */
      sockets: {
        "trading-state": null,
      },

      connected,

      connectionState: connected
        ? "CONNECTED"
        : "DISCONNECTED",
    }),
    [globalState, connected]
  );

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = (): GlobalStateContextValue => {
  const context = useContext(GlobalStateContext);

  if (!context) {
    throw new Error(
      "useGlobalState must be used inside GlobalStateProvider"
    );
  }

  return context;
};

