import { API_BASE_URL } from "../apiConfig";

export interface AuthUser {
  id: number;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  roles: string[];
}

export interface IdentityResponse {
  user_id: string;
  username: string | null;
  roles: string[];
  permissions: string[];
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUser;
}

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAuthTokens(): void {
  accessToken = null;
  refreshToken = null;
}

export async function login(
  email: string,
  password: string
): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Authentication failed.");
  }

  const data: TokenResponse = await response.json();

  accessToken = data.access_token;
  refreshToken = data.refresh_token;

  return data;
}

export async function refreshSession(): Promise<TokenResponse> {
  if (!refreshToken) {
    throw new Error("No refresh token available.");
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    clearAuthTokens();

    const detail = await response.text();
    throw new Error(detail || "Session refresh failed.");
  }

  const data: TokenResponse = await response.json();

  accessToken = data.access_token;
  refreshToken = data.refresh_token;

  return data;
}

export async function getCurrentIdentity(): Promise<IdentityResponse> {
  if (!accessToken) {
    throw new Error("No access token available.");
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to retrieve current identity.");
  }

  return response.json();
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  if (!accessToken) {
    throw new Error("No access token available.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  if (
    init.body &&
    !headers.has("Content-Type") &&
    typeof init.body === "string"
  ) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
