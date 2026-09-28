'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { AuthClient } from './AuthClient';
import type {
    AuthSession,
    AuthUser,
    Identity,
} from './types';

interface AuthContextValue {
    user: AuthUser | null;
    identity: Identity | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    login: (
        email: string,
        password: string,
    ) => Promise<AuthSession>;

    register: (
        email: string,
        password: string,
    ) => Promise<AuthUser>;

    logout: () => void;

    clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(
    undefined,
);

const ACCESS_TOKEN_KEY = 'volsim_access_token';
const REFRESH_TOKEN_KEY = 'volsim_refresh_token';
const USER_KEY = 'volsim_auth_user';
const IDENTITY_KEY = 'volsim_identity';

function getStored<T>(key: string): T | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const value = window.sessionStorage.getItem(key);

        if (!value) {
            return null;
        }

        return JSON.parse(value) as T;
    } catch {
        return null;
    }
}

function getStoredString(key: string): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.sessionStorage.getItem(key);
}

function storeSession(session: AuthSession) {
    if (typeof window === 'undefined') {
        return;
    }

    window.sessionStorage.setItem(
        ACCESS_TOKEN_KEY,
        session.access_token,
    );

    window.sessionStorage.setItem(
        REFRESH_TOKEN_KEY,
        session.refresh_token,
    );

    window.sessionStorage.setItem(
        USER_KEY,
        JSON.stringify(session.user),
    );
}

function storeIdentity(identity: Identity) {
    if (typeof window === 'undefined') {
        return;
    }

    window.sessionStorage.setItem(
        IDENTITY_KEY,
        JSON.stringify(identity),
    );
}

function clearStoredSession() {
    if (typeof window === 'undefined') {
        return;
    }

    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    window.sessionStorage.removeItem(USER_KEY);
    window.sessionStorage.removeItem(IDENTITY_KEY);
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (
        typeof error === 'object' &&
        error !== null
    ) {
        const candidate = error as {
            detail?: unknown;
            message?: unknown;
            error?: unknown;
        };

        if (typeof candidate.detail === 'string') {
            return candidate.detail;
        }

        if (typeof candidate.message === 'string') {
            return candidate.message;
        }

        if (typeof candidate.error === 'string') {
            return candidate.error;
        }
    }

    return 'Authentication request failed.';
}

export function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [identity, setIdentity] = useState<Identity | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const logout = useCallback(() => {
        clearStoredSession();

        setUser(null);
        setIdentity(null);
        setAccessToken(null);
        setRefreshToken(null);
        setError(null);
    }, []);

    const loadIdentity = useCallback(
        async (token: string) => {
            const currentIdentity = await AuthClient.me(token);

            setIdentity(currentIdentity);
            storeIdentity(currentIdentity);

            return currentIdentity;
        },
        [],
    );

    const login = useCallback(
        async (
            email: string,
            password: string,
        ): Promise<AuthSession> => {
            setIsLoading(true);
            setError(null);

            try {
                const session = await AuthClient.login(
                    email,
                    password,
                );

                storeSession(session);

                setUser(session.user);
                setAccessToken(session.access_token);
                setRefreshToken(session.refresh_token);

                try {
                    await loadIdentity(session.access_token);
                } catch {
                    setIdentity(null);
                    if (typeof window !== 'undefined') {
                        window.sessionStorage.removeItem(
                            IDENTITY_KEY,
                        );
                    }
                }

                return session;
            } catch (err) {
                const message = getErrorMessage(err);
                setError(message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [loadIdentity],
    );

    const register = useCallback(
        async (
            email: string,
            password: string,
        ): Promise<AuthUser> => {
            setIsLoading(true);
            setError(null);

            try {
                return await AuthClient.register(
                    email,
                    password,
                );
            } catch (err) {
                const message = getErrorMessage(err);
                setError(message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [],
    );

    useEffect(() => {
        let cancelled = false;

        async function restoreSession() {
            try {
                const storedAccessToken =
                    getStoredString(ACCESS_TOKEN_KEY);

                const storedRefreshToken =
                    getStoredString(REFRESH_TOKEN_KEY);

                const storedUser =
                    getStored<AuthUser>(USER_KEY);

                const storedIdentity =
                    getStored<Identity>(IDENTITY_KEY);

                if (
                    storedAccessToken &&
                    storedRefreshToken &&
                    storedUser
                ) {
                    if (cancelled) {
                        return;
                    }

                    setAccessToken(storedAccessToken);
                    setRefreshToken(storedRefreshToken);
                    setUser(storedUser);

                    if (storedIdentity) {
                        setIdentity(storedIdentity);
                    }

                    try {
                        await loadIdentity(
                            storedAccessToken,
                        );
                    } catch {
                        try {
                            const refreshed =
                                await AuthClient.refresh(
                                    storedRefreshToken,
                                );

                            if (cancelled) {
                                return;
                            }

                            storeSession(refreshed);

                            setUser(refreshed.user);
                            setAccessToken(
                                refreshed.access_token,
                            );
                            setRefreshToken(
                                refreshed.refresh_token,
                            );

                            try {
                                await loadIdentity(
                                    refreshed.access_token,
                                );
                            } catch {
                                logout();
                            }
                        } catch {
                            if (!cancelled) {
                                logout();
                            }
                        }
                    }
                }
            } catch {
                if (!cancelled) {
                    logout();
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }

        void restoreSession();

        return () => {
            cancelled = true;
        };
    }, [loadIdentity, logout]);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            identity,
            accessToken,
            refreshToken,

            isAuthenticated:
                Boolean(accessToken) &&
                Boolean(user),

            isLoading,
            error,

            login,
            register,
            logout,
            clearError,
        }),
        [
            user,
            identity,
            accessToken,
            refreshToken,
            isLoading,
            error,
            login,
            register,
            logout,
            clearError,
        ],
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth must be used within an AuthProvider.',
        );
    }

    return context;
}
