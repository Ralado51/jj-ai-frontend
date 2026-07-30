"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AuthUser,
  clearAccessToken,
  getAccessToken,
  getCurrentUser,
  login as loginRequest,
  LoginPayload,
  saveAccessToken,
} from "@/lib/auth";
import { AUTH_EXPIRED_EVENT } from "@/lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const endSession = useCallback(() => {
    clearAccessToken();
    setUser(null);
    router.replace("/login?reason=session-expired");
  }, [router]);

  const restoreSession = useCallback(async () => {
    const token = getAccessToken();

    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      endSession();
    } finally {
      setIsLoading(false);
    }
  }, [endSession]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, endSession);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, endSession);
  }, [endSession]);

  async function login(payload: LoginPayload) {
    const response = await loginRequest(payload);
    saveAccessToken(response.access_token);
    setUser(response.user);
    router.replace("/");
  }

  function logout() {
    clearAccessToken();
    setUser(null);
    router.replace("/login");
  }

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}
