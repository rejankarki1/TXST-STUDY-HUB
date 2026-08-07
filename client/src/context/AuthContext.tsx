import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  refreshAccessToken,
  signup as signupRequest,
} from "../api/auth.api.ts";
import { setApiAccessToken } from "../api/axios.ts";
import type { AuthUser, LoginPayload, SignupPayload } from "../types/auth.ts";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signup: (payload: SignupPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateAccessToken = useCallback((token: string | null) => {
    setAccessToken(token);
    setApiAccessToken(token);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    updateAccessToken(null);
  }, [updateAccessToken]);

  const refreshSession = useCallback(async () => {
    try {
      const refreshResponse = await refreshAccessToken();
      updateAccessToken(refreshResponse.data.accessToken);

      const currentUserResponse = await getCurrentUser();
      setUser(currentUserResponse.data.user);
    } catch {
      clearSession();
    }
  }, [clearSession, updateAccessToken]);

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const refreshResponse = await refreshAccessToken();
        if (!isMounted) return;

        updateAccessToken(refreshResponse.data.accessToken);

        const currentUserResponse = await getCurrentUser();
        if (!isMounted) return;

        setUser(currentUserResponse.data.user);
      } catch {
        if (isMounted) {
          clearSession();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void initializeAuth();

    return () => {
      isMounted = false;
    };
  }, [clearSession, updateAccessToken]);

  const signup = useCallback(
    async (payload: SignupPayload) => {
      const response = await signupRequest(payload);
      updateAccessToken(response.data.accessToken);
      setUser(response.data.user);
    },
    [updateAccessToken],
  );

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await loginRequest(payload);
      updateAccessToken(response.data.accessToken);
      setUser(response.data.user);
    },
    [updateAccessToken],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: Boolean(user && accessToken),
      signup,
      login,
      logout,
      refreshSession,
    }),
    [accessToken, isLoading, login, logout, refreshSession, signup, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

