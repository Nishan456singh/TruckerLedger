import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { getAppwriteUser, logoutAppwrite } from './appwriteAuth';
import {
    clearUserSession,
    type UserProfile,
} from './authStorage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: UserProfile | null;
  authLoading: boolean;
  signIn: (user: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  authLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // On mount: restore an active Appwrite session if one exists.
  useEffect(() => {
    async function restoreSession() {
      const appwriteUser = await getAppwriteUser();
      if (appwriteUser) {
        setUser(appwriteUser);
      }
    }

    restoreSession()
      .catch(console.error)
      .finally(() => setAuthLoading(false));
  }, []);

  const signIn = useCallback(async (incoming: UserProfile) => {
    setUser(incoming);
  }, []);

  const signOut = useCallback(async () => {
    await logoutAppwrite();
    await clearUserSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, authLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export type { UserProfile };
