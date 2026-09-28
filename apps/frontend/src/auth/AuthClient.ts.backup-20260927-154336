import { TradingApiClient } from "../../lib/TradingApiClient";
import type {
    AuthSession,
    AuthUser,
    Identity,
} from "./types";

export class AuthClient {

    static async register(
        email: string,
        password: string,
    ): Promise<AuthUser> {
        return TradingApiClient.post(
            "/api/auth/register",
            {
                email,
                password,
            },
        );
    }

    static async login(
        email: string,
        password: string,
    ): Promise<AuthSession> {
        return TradingApiClient.post(
            "/api/auth/login",
            {
                email,
                password,
            },
        );
    }

    static async refresh(
        refreshToken: string,
    ): Promise<AuthSession> {
        return TradingApiClient.post(
            "/api/auth/refresh",
            {
                refresh_token: refreshToken,
            },
        );
    }

    static async me(
        accessToken: string,
    ): Promise<Identity> {
        return TradingApiClient.get(
            "/api/auth/me",
            {
                Authorization: `Bearer ${accessToken}`,
            },
        );
    }
}
