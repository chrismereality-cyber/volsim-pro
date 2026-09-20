import { API_BASE, WS_BASE } from "./config";

export class TradingApiClient {

    static api(path: string): string {
        return `${API_BASE}${path}`;
    }

    static ws(path: string): string {
        return `${WS_BASE}${path}`;
    }

    static async get(
        path: string,
        headers?: Record<string, string>,
    ) {
        const response = await fetch(this.api(path), {
            method: "GET",
            headers,
        });

        if (!response.ok) {
            throw new Error(`GET ${path} failed (${response.status})`);
        }

        return response.json();
    }

    static async getAuthenticated(
        path: string,
        accessToken: string,
    ) {
        return this.get(path, {
            Authorization: `Bearer ${accessToken}`,
        });
    }

    static async post(
        path: string,
        body: unknown,
        headers?: Record<string, string>,
    ) {
        const response = await fetch(this.api(path), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`POST ${path} failed (${response.status})`);
        }

        return response.json();
    }

    static async patch(
        path: string,
        body: unknown,
        headers?: Record<string, string>,
    ) {
        const response = await fetch(this.api(path), {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`PATCH ${path} failed (${response.status})`);
        }

        return response.json();
    }

    static async put(
        path: string,
        body: unknown,
        headers?: Record<string, string>,
    ) {
        const response = await fetch(this.api(path), {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...headers,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`PUT ${path} failed (${response.status})`);
        }

        return response.json();
    }

    static async patchAuthenticated(
        path: string,
        accessToken: string,
        body: unknown,
    ) {
        return this.patch(path, body, {
            Authorization: `Bearer ${accessToken}`,
        });
    }

    static async putAuthenticated(
        path: string,
        accessToken: string,
        body: unknown,
    ) {
        return this.put(path, body, {
            Authorization: `Bearer ${accessToken}`,
        });
    }
}
