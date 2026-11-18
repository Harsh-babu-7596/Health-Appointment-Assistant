import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { createApiClient, type ApiClient } from "../api.js";
import type { Role, User } from "../types.js";
import { FullPageSpinner } from "./components.js";

interface AuthContextValue {
  role: Role;
  user: User | null;
  ready: boolean;
  api: ApiClient;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; phone?: string; password: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Holds the session for one app. Each app passes its own role, so tokens never leak between apps. */
export function AuthProvider({ role, apiBaseUrl, children }: { role: Role; apiBaseUrl?: string; children: ReactNode }) {
  const storageKey = `medislot.${role}.token`;
  const tokenRef = useRef<string | null>(localStorage.getItem(storageKey));
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const saveToken = useCallback(
    (token: string | null) => {
      tokenRef.current = token;
      if (token) localStorage.setItem(storageKey, token);
      else localStorage.removeItem(storageKey);
    },
    [storageKey],
  );

  const logout = useCallback(() => {
    saveToken(null);
    setUser(null);
  }, [saveToken]);

  const api = useMemo(
    () => createApiClient({ baseUrl: apiBaseUrl || undefined, getToken: () => tokenRef.current, onUnauthorized: logout }),
    [apiBaseUrl, logout],
  );

  useEffect(() => {
    if (!tokenRef.current) {
      setReady(true);
      return;
    }
    api.auth
      .me()
      .then(({ user }) => (user.role === role ? setUser(user) : logout()))
      .catch(() => logout())
      .finally(() => setReady(true));
  }, [api, role, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      role,
      user,
      ready,
      api,
      logout,
      setUser,
      login: async (email, password) => {
        const res = await api.auth.login(email, password, role);
        saveToken(res.token);
        setUser(res.user);
      },
      register: async (input) => {
        const res = await api.auth.register(input);
        saveToken(res.token);
        setUser(res.user);
      },
    }),
    [role, user, ready, api, logout, saveToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export const useApi = () => useAuth().api;

/** Redirects to /login when there's no session. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
