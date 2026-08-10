import React from 'react';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  // SocketProvider is deprecated. Use GlobalStateProvider instead.
  return <>{children}</>;
};
