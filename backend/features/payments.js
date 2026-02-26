const axios = require("axios");

const verifyPaystack = async (reference) => {
    try {
        const url = `https://api.paystack.co/transaction/verify/${reference}`;
        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            }
        });
        return response.data;
    } catch (error) {
        console.error("Paystack Verification Error:", error.response?.data || error.message);
        return null;
    }
};

module.exports = { verifyPaystack };
