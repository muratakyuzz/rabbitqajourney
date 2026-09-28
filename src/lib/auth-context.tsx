import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getMe, loginApi, logoutApi, toAppRole, type AppRole, type AuthUser } from "@/lib/auth-api";

// auth: mock-only (no backend in sandbox)
const TOKEN_KEY = "partner-ecosystem-token";

interface AuthContextType {
  user: AuthUser | null;
  role: AppRole;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const refreshMe = async () => {
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const me = await getMe(token);
      setUser(me);
    } catch {
      clearSession();
    }
  };

  useEffect(() => {
    (async () => {
      await refreshMe();
      setIsLoading(false);
    })();
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await loginApi(email, password);
    localStorage.setItem(TOKEN_KEY, response.token);
    setToken(response.token);

    try {
      const me = await getMe(response.token);
      setUser(me);
      return me;
    } catch {
      clearSession();
      throw new Error("Unable to load session");
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await logoutApi(token);
      } catch {
        // no-op: local clear still required
      }
    }
    clearSession();
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      role: user ? toAppRole(user.role) : "admin",
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshMe,
    }),
    [user, token, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
