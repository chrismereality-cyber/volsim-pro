const generateSignal = (strategy = 'normal') => {
    const winProbability = strategy === 'recovery' ? 0.65 : 0.52;
    const outcome = Math.random() < winProbability ? 'win' : 'loss';
    return { 
        outcome, 
        market: { index: 'VOL_100', trend: 1.0 + (Math.random() * 0.1) } 
    };
};
module.exports = { generateSignal };
