/**
 * VolSim-Pro Market Engine
 * Simulates or fetches live market volatility.
 */
const getMarketTrend = () => {
    // Simulated Volatility Index (e.g., VIX or Synthetic Volatility 100)
    // In a real-world scenario, you'd fetch from a Trading API here.
    const indices = ['VOL_75', 'VOL_100', 'VOL_25', 'VOL_50'];
    const selected = indices[Math.floor(Math.random() * indices.length)];
    
    // Trend: 1.0 is neutral, > 1.0 is Bullish (Up), < 1.0 is Bearish (Down)
    const trendStrength = (Math.random() * (1.2 - 0.8) + 0.8).toFixed(2);
    
    return {
        index: selected,
        trend: parseFloat(trendStrength),
        volatility: Math.random() > 0.7 ? 'High' : 'Stable'
    };
};

module.exports = { getMarketTrend };
