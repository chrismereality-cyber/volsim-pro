export interface AuthUser {
    id: number;
    email: string;
    is_active: boolean;
    is_verified: boolean;
    roles: string[];
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface AuthSession extends AuthTokens {
    user: AuthUser;
}

export interface Identity {
    user_id: string;
    username: string | null;
    roles: string[];
    permissions: string[];
    is_active: boolean;
}
