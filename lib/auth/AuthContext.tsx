import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getCurrentUser,
  logout as logoutAppwrite,
  signInWithApple,
  signInWithGoogle,
  type UserProfile,
} from "./appwriteAuth";

import { clearUserSession } from "./authStorage";

// ─── Types ─────────────────────────────────────────

interface AuthContextValue {
  user: UserProfile | null;
  authLoading: boolean;
  signInGoogle: () => Promise<void>;
  signInApple: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─── Context ───────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  authLoading: true,
  signInGoogle: async () => {},
  signInApple: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

// ─── Provider ──────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const u = await getCurrentUser();
        setUser(u);
      } catch (error) {
        console.error("Session restore failed:", error);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ─── Google login ───────────────────────────────

const signInGoogle = useCallback(async () => {
  try {
    setAuthLoading(true);

    await signInWithGoogle();

    const u = await getCurrentUser();
    setUser(u);
  } catch (error) {
    console.error("Google login failed:", error);
    throw error;
  } finally {
    setAuthLoading(false);
  }
}, []);

  // ─── Apple login ────────────────────────────────

 const signInApple = useCallback(async () => {
  try {
    setAuthLoading(true);

    await signInWithApple();

    const u = await getCurrentUser();
    setUser(u);
  } catch (error) {
    console.error("Apple login failed:", error);
    throw error;
  } finally {
    setAuthLoading(false);
  }
}, []);
  // ─── Logout ─────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      setAuthLoading(true);

      await logoutAppwrite();
      await clearUserSession();

      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ─── Refresh user session ───────────────────────

  const refreshUser = useCallback(async () => {
    try {
      setAuthLoading(true);

      const u = await getCurrentUser();
      setUser(u);
    } catch (error) {
      console.error("Refresh user failed:", error);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        signInGoogle,
        signInApple,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export type { UserProfile };
