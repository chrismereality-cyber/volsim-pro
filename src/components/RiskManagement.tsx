import React from 'react';
import { useGlobalState } from '../context/GlobalStateContext';

const RiskManagement = () => {
  const { state } = useGlobalState(); 

  // Removed any redundant WebSocket initialization logic.
  // This component now relies on the GlobalStateProvider 
  // for all WebSocket connectivity.

  return (
    <div className="risk-management-container">
      {/* Risk management dashboard UI implementation goes here */}
      <h1>Risk Management Console</h1>
    </div>
  );
};

export default RiskManagement;
