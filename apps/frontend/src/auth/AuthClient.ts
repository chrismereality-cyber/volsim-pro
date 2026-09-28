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

    static async getBiometricAuthenticationOptions(
        email: string,
    ): Promise<Record<string, unknown>> {
        return TradingApiClient.post(
            "/api/auth/webauthn/authenticate/options",
            { email },
        );
    }

    static async verifyBiometricCredential(
        credential: Record<string, unknown>,
    ): Promise<AuthSession> {
        return TradingApiClient.post(
            "/api/auth/webauthn/authenticate/verify",
            { credential },
        );
    }

    static async getWebAuthnRegistrationOptions(
        accessToken: string,
    ): Promise<Record<string, unknown>> {
        return TradingApiClient.post(
            "/api/auth/webauthn/register/options",
            {},
            {
                Authorization: `Bearer ${accessToken}`,
            },
        );
    }

    static async verifyWebAuthnRegistration(
        accessToken: string,
        credential: Record<string, unknown>,
    ): Promise<Record<string, unknown>> {
        return TradingApiClient.post(
            "/api/auth/webauthn/register/verify",
            { credential },
            {
                Authorization: `Bearer ${accessToken}`,
            },
        );
    }
}
