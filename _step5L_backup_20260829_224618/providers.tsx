'use client';

import React from 'react';
import { GlobalStateProvider } from '../context/GlobalStateContext';
import { TradingStateBridge } from '../components/TradingStateBridge';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalStateProvider>
      <TradingStateBridge />
      {children}
    </GlobalStateProvider>
  );
}
