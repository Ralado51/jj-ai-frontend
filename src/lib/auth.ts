import { api } from "@/lib/api";

export type UserRole = "admin" | "manager" | "member" | string;

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

const TOKEN_KEY = "jj_ai_access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function saveAccessToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/api/v1/auth/login", payload);
  return response.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await api.get<AuthUser>("/api/v1/auth/me");
  return response.data;
}
