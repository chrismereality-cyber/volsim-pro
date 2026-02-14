let engineState = {
  price: 0,
  gain: 0,
  upperLimit: 90062.86,   // example
  lowerLimit: 88279.44,   // example
  lastSignal: null          // "BUY" or "SELL"
};

export function updateEngineState(update) {
  // Detect signal based on price crossing limits
  if (update.price !== undefined) {
    if (update.price >= engineState.upperLimit) {
      update.lastSignal = "SELL";
    } else if (update.price <= engineState.lowerLimit) {
      update.lastSignal = "BUY";
    }
  }

  engineState = { ...engineState, ...update };
}

export function getEngineState() {
  return engineState;
}
