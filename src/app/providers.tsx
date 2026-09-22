'use client';

import React from 'react';
import { GlobalStateProvider } from '../context/GlobalStateContext';
import { TradingStateBridge } from '../components/TradingStateBridge';
import { AuthProvider } from './AuthProvider';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalStateProvider>
      <AuthProvider>
        <TradingStateBridge />
        {children}
      </AuthProvider>
    </GlobalStateProvider>
  );
}
