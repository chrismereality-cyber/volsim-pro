import fetch from 'node-fetch';

// You will get these from BotFather on Telegram later
const BOT_TOKEN = process.env.TELEGRAM_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

export const sendAlert = async (message) => {
    if (!BOT_TOKEN || !CHAT_ID) {
        console.log("Telegram not configured. Alert:", message);
        return;
    }
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: `🤖 VOLSIM-PRO:\n${message}` })
        });
    } catch (e) {
        console.error("Telegram Error:", e.message);
    }
};
