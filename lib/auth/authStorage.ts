import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@truckerledger/user_session';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuthProvider = 'google' | 'apple';

/**
 * Unified user profile returned by all providers.
 * Google and Apple are normalised to this shape.
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  provider: AuthProvider;
}

// ─── Storage helpers ─────────────────────────────────────────────────────────
// We store only the profile — never OAuth tokens.

export async function saveUserSession(user: UserProfile): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export async function getUserSession(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function clearUserSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
