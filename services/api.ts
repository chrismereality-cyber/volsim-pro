const BASE_URL = "http://127.0.0.1:8000";

export async function getPortfolio(userId: string) {
    const res = await fetch(`${BASE_URL}/portfolio?user_id=${userId}`);
    return res.json();
}

export async function getVault(userId: string) {
    const res = await fetch(`${BASE_URL}/vault?user_id=${userId}`);
    return res.json();
}
