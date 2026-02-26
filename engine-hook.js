<<<<<<< HEAD
import fs from 'fs';

// Log engine events
function logEvent(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  fs.appendFileSync('primary.log', logLine);
  console.log(logLine.trim());
}

// Handle price updates and generate BUY/SELL signals
export function handlePriceUpdate({ price, upperLimit, lowerLimit }) {
  let action = null;

  if (price >= upperLimit) {
    action = 'SELL';
    logEvent(`[ENGINE] SELL signal triggered at $${price}`);
  } else if (price <= lowerLimit) {
    action = 'BUY';
    logEvent(`[ENGINE] BUY signal triggered at $${price}`);
  } else {
    logEvent(`[ENGINE] Price stable at $${price}`);
  }

  return action ? { action, price } : null;
=======
import { updateEngineState } from './engine-state.js';

export function onPriceUpdate(price) {
  const gain = calculateGain(price);

  updateEngineState({ price, gain });

  const state = getEngineState();
  const signalText = state.lastSignal ? ` | Signal: ${state.lastSignal}` : '';
  console.log(`[ENGINE] Price: $${price} | Gain: ${gain}%${signalText}`);
}

import { getEngineState } from './engine-state.js';

function calculateGain(price) {
  return ((price - 88000) / 88000 * 100).toFixed(2);
>>>>>>> 63c02ebdf9a72c0ded7b4048af9a6ccd6cb9a8e0
}
