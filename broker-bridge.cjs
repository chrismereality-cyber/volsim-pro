const axios = require('axios');
const DERIV_TOKEN = process.env.DERIV_TOKEN;

// This function sends the actual trade to the broker
async function executeBrokerTrade(symbol, amount) {
    try {
        const response = await axios.post('https://api.deriv.com/v3/trade', {
            action: 'buy',
            symbol: symbol,
            amount: amount,
            token: DERIV_TOKEN
        });
        return response.data;
    } catch (error) {
        return { error: 'BROKER_CONNECTION_FAILED' };
    }
}