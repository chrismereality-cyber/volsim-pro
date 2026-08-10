import { API_BASE, WS_BASE } from "./config";

export class TradingApiClient {

    static api(path: string): string {
        return `${API_BASE}${path}`;
    }

    static ws(path: string): string {
        return `${WS_BASE}${path}`;
    }

    static async get(path: string) {

        const response = await fetch(this.api(path));

        if (!response.ok) {
            throw new Error(`GET ${path} failed (${response.status})`);
        }

        return response.json();

    }

    static async post(path: string, body: unknown) {

        const response = await fetch(this.api(path), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`POST ${path} failed (${response.status})`);
        }

        return response.json();

    }

}
