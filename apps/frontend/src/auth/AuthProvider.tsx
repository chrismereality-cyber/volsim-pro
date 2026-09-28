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

    biometricLogin: (
        email: string,
    ) => Promise<AuthSession>;

    register: (
        email: string,
        password: string,
    ) => Promise<AuthUser>;

    registerPasskey: () => Promise<{
        success: boolean;
        credential_id: string;
        user_verified: boolean;
    }>;

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

type UserVerificationRequirement =
    | 'required'
    | 'preferred'
    | 'discouraged';

function base64UrlToArrayBuffer(
    value: string,
): ArrayBuffer {
    const normalized = value
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const padded =
        normalized +
        '='.repeat(
            (4 - (normalized.length % 4)) % 4,
        );

    const binary = window.atob(padded);
    const bytes = new Uint8Array(
        binary.length,
    );

    for (
        let index = 0;
        index < binary.length;
        index += 1
    ) {
        bytes[index] =
            binary.charCodeAt(index);
    }

    return bytes.buffer;
}

function arrayBufferToBase64Url(
    buffer: ArrayBuffer,
): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return window
        .btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
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

    const biometricLogin = useCallback(
        async (
            email: string,
        ): Promise<AuthSession> => {
            setIsLoading(true);
            setError(null);

            try {
                if (
                    typeof window === 'undefined' ||
                    !window.PublicKeyCredential
                ) {
                    throw new Error(
                        'Biometric authentication is not supported in this browser.',
                    );
                }

                const options =
                    await AuthClient.getBiometricAuthenticationOptions(
                        email,
                    );

                const publicKey =
                    options as Record<string, unknown>;

                const challenge =
                    publicKey.challenge;

                if (typeof challenge !== 'string') {
                    throw new Error(
                        'WebAuthn authentication challenge is missing.',
                    );
                }

                const allowCredentials =
                    Array.isArray(
                        publicKey.allowCredentials,
                    )
                        ? publicKey.allowCredentials.map(
                              (
                                  descriptor,
                              ) => {
                                  const item =
                                      descriptor as {
                                          id?: unknown;
                                          type?: unknown;
                                      };

                                  if (
                                      typeof item.id !==
                                      'string'
                                  ) {
                                      throw new Error(
                                          'Invalid WebAuthn credential identifier.',
                                      );
                                  }

                                  return {
                                      id:
                                          base64UrlToArrayBuffer(
                                              item.id,
                                          ),
                                      type:
                                          'public-key' as const,
                                  };
                              },
                          )
                        : undefined;

                const credential =
                    await navigator.credentials.get({
                        publicKey: {
                            challenge:
                                base64UrlToArrayBuffer(
                                    challenge,
                                ),
                            rpId:
                                typeof publicKey.rpId ===
                                'string'
                                    ? publicKey.rpId
                                    : undefined,
                            timeout:
                                typeof publicKey.timeout ===
                                'number'
                                    ? publicKey.timeout
                                    : undefined,
                            userVerification:
                                typeof publicKey.userVerification ===
                                'string'
                                    ? publicKey.userVerification as
                                          UserVerificationRequirement
                                    : 'required',
                            allowCredentials,
                        },
                    });

                if (
                    !credential ||
                    !(credential instanceof
                        PublicKeyCredential)
                ) {
                    throw new Error(
                        'No biometric credential was returned.',
                    );
                }

                const response =
                    credential.response;

                if (
                    !(response instanceof
                        AuthenticatorAssertionResponse)
                ) {
                    throw new Error(
                        'Invalid WebAuthn authentication response.',
                    );
                }

                const serializedCredential = {
                    id: credential.id,
                    rawId:
                        arrayBufferToBase64Url(
                            credential.rawId,
                        ),
                    response: {
                        clientDataJSON:
                            arrayBufferToBase64Url(
                                response.clientDataJSON,
                            ),
                        authenticatorData:
                            arrayBufferToBase64Url(
                                response.authenticatorData,
                            ),
                        signature:
                            arrayBufferToBase64Url(
                                response.signature,
                            ),
                        userHandle:
                            response.userHandle
                                ? arrayBufferToBase64Url(
                                      response.userHandle,
                                  )
                                : null,
                    },
                    type: credential.type,
                };

                const session =
                    await AuthClient.verifyBiometricCredential(
                        serializedCredential,
                    );

                storeSession(session);

                setUser(session.user);
                setAccessToken(
                    session.access_token,
                );
                setRefreshToken(
                    session.refresh_token,
                );

                try {
                    await loadIdentity(
                        session.access_token,
                    );
                } catch {
                    setIdentity(null);

                    if (
                        typeof window !== 'undefined'
                    ) {
                        window.sessionStorage.removeItem(
                            IDENTITY_KEY,
                        );
                    }
                }

                return session;
            } catch (err) {
                const message =
                    getErrorMessage(err);

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

    const registerPasskey = useCallback(
        async (): Promise<{
            success: boolean;
            credential_id: string;
            user_verified: boolean;
        }> => {
            setIsLoading(true);
            setError(null);

            try {
                if (
                    typeof window === 'undefined' ||
                    !window.PublicKeyCredential
                ) {
                    throw new Error(
                        'Passkey registration is not supported in this browser.',
                    );
                }

                if (!accessToken) {
                    throw new Error(
                        'You must be authenticated to register a passkey.',
                    );
                }

                const options =
                    await AuthClient.getWebAuthnRegistrationOptions(
                        accessToken,
                    );

                const publicKey =
                    options as Record<string, unknown>;

                const challenge =
                    publicKey.challenge;

                if (typeof challenge !== 'string') {
                    throw new Error(
                        'WebAuthn registration challenge is missing.',
                    );
                }

                const rp =
                    publicKey.rp;

                if (
                    typeof rp !== 'object' ||
                    rp === null
                ) {
                    throw new Error(
                        'WebAuthn relying-party information is missing.',
                    );
                }

                const rpRecord =
                    rp as Record<string, unknown>;

                const rpName =
                    rpRecord.name;

                if (typeof rpName !== 'string') {
                    throw new Error(
                        'WebAuthn relying-party name is missing.',
                    );
                }

                const rpId =
                    rpRecord.id;

                const user =
                    publicKey.user;

                if (
                    typeof user !== 'object' ||
                    user === null
                ) {
                    throw new Error(
                        'WebAuthn user information is missing.',
                    );
                }

                const userRecord =
                    user as Record<string, unknown>;

                const userId =
                    userRecord.id;
                const userName =
                    userRecord.name;
                const userDisplayName =
                    userRecord.displayName;

                if (
                    typeof userId !== 'string' ||
                    typeof userName !== 'string' ||
                    typeof userDisplayName !== 'string'
                ) {
                    throw new Error(
                        'Invalid WebAuthn user information.',
                    );
                }

                const pubKeyCredParams =
                    Array.isArray(
                        publicKey.pubKeyCredParams,
                    )
                        ? publicKey.pubKeyCredParams
                              .filter(
                                  (
                                      parameter,
                                  ) => {
                                      const item =
                                          parameter as {
                                              type?: unknown;
                                              alg?: unknown;
                                          };

                                      return (
                                          item.type ===
                                              'public-key' &&
                                          typeof item.alg ===
                                              'number'
                                      );
                                  },
                              )
                              .map(
                                  (
                                      parameter,
                                  ) => {
                                      const item =
                                          parameter as {
                                              type: 'public-key';
                                              alg: number;
                                          };

                                      return {
                                          type: 'public-key' as const,
                                          alg: item.alg,
                                      };
                                  },
                              )
                        : [];

                if (
                    pubKeyCredParams.length === 0
                ) {
                    throw new Error(
                        'No supported WebAuthn credential algorithms were provided.',
                    );
                }

                const excludeCredentials =
                    Array.isArray(
                        publicKey.excludeCredentials,
                    )
                        ? publicKey.excludeCredentials.map(
                              (
                                  descriptor,
                              ) => {
                                  const item =
                                      descriptor as {
                                          id?: unknown;
                                      };

                                  if (
                                      typeof item.id !==
                                      'string'
                                  ) {
                                      throw new Error(
                                          'Invalid existing WebAuthn credential identifier.',
                                      );
                                  }

                                  return {
                                      id:
                                          base64UrlToArrayBuffer(
                                              item.id,
                                          ),
                                      type:
                                          'public-key' as const,
                                  };
                              },
                          )
                        : undefined;

                const credential =
                    await navigator.credentials.create({
                        publicKey: {
                            challenge:
                                base64UrlToArrayBuffer(
                                    challenge,
                                ),
                            rp: {
                                name: rpName,
                                ...(typeof rpId === 'string'
                                    ? { id: rpId }
                                    : {}),
                            },
                            user: {
                                id:
                                    base64UrlToArrayBuffer(
                                        userId,
                                    ),
                                name: userName,
                                displayName:
                                    userDisplayName,
                            },
                            pubKeyCredParams,
                            timeout:
                                typeof publicKey.timeout ===
                                'number'
                                    ? publicKey.timeout
                                    : undefined,
                            excludeCredentials,
                            authenticatorSelection:
                                typeof publicKey.authenticatorSelection ===
                                    'object' &&
                                publicKey.authenticatorSelection !==
                                    null
                                    ? publicKey.authenticatorSelection as AuthenticatorSelectionCriteria
                                    : undefined,
                            attestation:
                                typeof publicKey.attestation ===
                                'string'
                                    ? publicKey.attestation as AttestationConveyancePreference
                                    : undefined,
                        },
                    });

                if (
                    !credential ||
                    !(credential instanceof
                        PublicKeyCredential)
                ) {
                    throw new Error(
                        'No passkey credential was created.',
                    );
                }

                const response =
                    credential.response;

                if (
                    !(response instanceof
                        AuthenticatorAttestationResponse)
                ) {
                    throw new Error(
                        'Invalid WebAuthn registration response.',
                    );
                }

                const serializedCredential = {
                    id: credential.id,
                    rawId:
                        arrayBufferToBase64Url(
                            credential.rawId,
                        ),
                    response: {
                        clientDataJSON:
                            arrayBufferToBase64Url(
                                response.clientDataJSON,
                            ),
                        attestationObject:
                            arrayBufferToBase64Url(
                                response.attestationObject,
                            ),
                    },
                    type: credential.type,
                };

                const result =
                    await AuthClient.verifyWebAuthnRegistration(
                        accessToken,
                        serializedCredential,
                    );

                return {
                    success:
                        result.success === true,
                    credential_id:
                        typeof result.credential_id ===
                        'string'
                            ? result.credential_id
                            : '',
                    user_verified:
                        result.user_verified === true,
                };
            } catch (err) {
                const message =
                    getErrorMessage(err);

                setError(message);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [accessToken],
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
            biometricLogin,
            register,
            registerPasskey,
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
            biometricLogin,
            register,
            registerPasskey,
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




