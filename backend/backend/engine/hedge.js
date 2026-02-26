/**
 * VolSim-Pro Guard & Hedge
 * Protects the balance when the AI detects a downward spiral.
 */
const checkRisk = (userBalance, stake, history) => {
    const consecutiveLosses = history.slice(-3).filter(h => h === 'loss').length;
    
    // Risk Guard: Stop if stake is > 20% of balance
    if (stake > userBalance * 0.20) {
        return { action: 'block', message: 'Stake too high! Risk exceeds 20% of balance.' };
    }

    // Hedge Activation: If 3 losses in a row, reduce next stake automatically
    if (consecutiveLosses >= 3) {
        return { action: 'hedge', message: 'Hedge Active: Strategy shifted to Recovery Mode.' };
    }

    return { action: 'proceed' };
};

module.exports = { checkRisk };
