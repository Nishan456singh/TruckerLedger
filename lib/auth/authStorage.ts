import AsyncStorage from "@react-native-async-storage/async-storage";

export const SESSION_KEY = "@truckerledger/user_session";

// ─── Types ─────────────────────────────────────────

export type AuthProvider = "google" | "apple";

/**
 * Unified user profile returned by all providers.
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  provider: AuthProvider;
}

// ─── Save session ──────────────────────────────────

export async function saveUserSession(user: UserProfile): Promise<void> {
  try {
    const value = JSON.stringify(user);
    await AsyncStorage.setItem(SESSION_KEY, value);
  } catch (error) {
    console.error("Failed to save user session:", error);
  }
}

// ─── Get session ───────────────────────────────────

export async function getUserSession(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // basic validation
    if (
      typeof parsed.id === "string" &&
      typeof parsed.email === "string"
    ) {
      return parsed as UserProfile;
    }

    return null;
  } catch (error) {
    console.error("Failed to read user session:", error);
    return null;
  }
}

// ─── Clear session ─────────────────────────────────

export async function clearUserSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error("Failed to clear user session:", error);
  }
}