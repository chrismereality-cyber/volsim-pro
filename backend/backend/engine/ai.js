const { getMarketTrend } = require('./market');

/**
 * VolSim-Pro AI Brain (V2)
 * Now analyzes market trends before generating signals.
 */
const generateSignal = (strategy = 'normal', history = []) => {
    const market = getMarketTrend();
    let winProbability = 0.50;

    // Influence Probability based on Market Trend
    // If trend > 1.0 (Bullish) and strategy is normal, boost win chance slightly
    if (market.trend > 1.05) winProbability += 0.05;
    if (market.trend < 0.95) winProbability -= 0.05;

    // Strategy Multipliers
    if (strategy === 'recovery') winProbability += 0.10;
    if (strategy === 'aggressive') winProbability -= 0.05; // High risk

    // Market Volatility Penalty
    if (market.volatility === 'High') {
        winProbability -= 0.02; // Harder to predict in high vol
    }

    const roll = Math.random();
    const outcome = roll < winProbability ? 'win' : 'loss';

    return {
        outcome,
        marketContext: market,
        confidence: (winProbability * 100).toFixed(1) + '%'
    };
};

module.exports = { generateSignal };
