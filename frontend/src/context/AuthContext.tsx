import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { api, getStoredAuth, setStoredAuth, clearStoredAuth, type AuthUser } from "@/lib/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  /** Current authentication status */
  status: AuthStatus;
  /** User data (null if not authenticated) */
  user: AuthUser | null;
  /** JWT access token (null if not authenticated) */
  accessToken: string | null;
  /** Whether the user is an admin */
  isAdmin: boolean;
  /** Whether the user's email is verified */
  isVerified: boolean;
  /** Login and store session */
  login: (user: AuthUser, accessToken: string) => void;
  /** Logout and clear session */
  logout: () => Promise<void>;
  /** Refresh user data from server */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  /**
   * Validate session by calling /auth/me
   * This ensures we have fresh data from the database, not stale localStorage
   */
  const validateSession = useCallback(async () => {
    const stored = getStoredAuth();
    
    if (!stored?.accessToken) {
      setStatus("unauthenticated");
      setUser(null);
      setAccessToken(null);
      return;
    }

    try {
      // Call /auth/me to validate token and get fresh user data
      const response = await api.me();
      
      // Update local storage with fresh data
      const freshAuth = {
        user: response.user,
        accessToken: stored.accessToken,
      };
      setStoredAuth(freshAuth);
      
      setUser(response.user);
      setAccessToken(stored.accessToken);
      setStatus("authenticated");
    } catch (error) {
      // Token is invalid or expired - clear everything
      console.warn("Session validation failed:", error);
      clearStoredAuth();
      setUser(null);
      setAccessToken(null);
      setStatus("unauthenticated");
    }
  }, []);

  // Validate session on mount
  useEffect(() => {
    void validateSession();
  }, [validateSession]);

  const login = useCallback((newUser: AuthUser, newToken: string) => {
    setStoredAuth({ user: newUser, accessToken: newToken });
    setUser(newUser);
    setAccessToken(newToken);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout API errors - we'll clear local state anyway
    }
    clearStoredAuth();
    setUser(null);
    setAccessToken(null);
    setStatus("unauthenticated");
  }, []);

  const refresh = useCallback(async () => {
    await validateSession();
  }, [validateSession]);

  const isAdmin = user?.role === "admin";
  const isVerified = user?.emailVerified === true;

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      accessToken,
      isAdmin,
      isVerified,
      login,
      logout,
      refresh,
    }),
    [status, user, accessToken, isAdmin, isVerified, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
