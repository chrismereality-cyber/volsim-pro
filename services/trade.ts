const BASE_URL = "http://localhost:8000";

export async function placeTrade(userId, symbol, side, volume) {
    const res = await fetch(`${BASE_URL}/trade`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            user_id: userId,
            symbol,
            side,
            volume
        })
    });

    return res.json();
}
