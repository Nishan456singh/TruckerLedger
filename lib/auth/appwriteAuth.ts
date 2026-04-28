import { OAuthProvider } from "appwrite";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { account } from "../appwrite";

WebBrowser.maybeCompleteAuthSession();

// ─── Types ─────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  provider: "google" | "apple";
}

// ─── OAuth flow ───────────────────────────────────

async function performOAuth(provider: OAuthProvider): Promise<void> {
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

  if (!projectId) {
    throw new Error("Missing EXPO_PUBLIC_APPWRITE_PROJECT_ID.");
  }

  // Web login (browser redirect handled by Appwrite)
  if (Platform.OS === "web") {
    const success = `${window.location.origin}/oauth/success`;
    const failure = `${window.location.origin}/oauth/failure`;

    await account.createOAuth2Session(provider, success, failure);
    return;
  }

  // Native callback scheme
  const endpoint =
    process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ??
    "https://sfo.cloud.appwrite.io/v1";

  const callbackScheme = `appwrite-callback-${projectId}`;
  const callbackUrl = `${callbackScheme}://oauth/success`;

  // Build OAuth URL manually — createOAuth2Token() sets location.href (web-only)
  const oauthUrl =
    `${endpoint}/account/tokens/oauth2/${provider}` +
    `?project=${encodeURIComponent(projectId)}` +
    `&success=${encodeURIComponent(callbackUrl)}` +
    `&failure=${encodeURIComponent(callbackUrl)}`;

  // Open OAuth browser session
  const result = await WebBrowser.openAuthSessionAsync(
    oauthUrl,
    callbackUrl
  );

  if (result.type !== "success" || !result.url) {
    throw new Error("Sign-in cancelled.");
  }

  // Parse returned URL
  const url = new URL(result.url);

  const userId = url.searchParams.get("userId");
  const secret = url.searchParams.get("secret");

  if (!userId || !secret) {
    throw new Error("OAuth failed. Missing userId or secret.");
  }

  // Exchange token for session
  try {
    await account.deleteSession("current");
  } catch {
    // No active session to clear — this is expected on first login
  }
  await account.createSession(userId, secret);
}

// ─── Public login functions ───────────────────────

export async function signInWithGoogle(): Promise<void> {
  await performOAuth(OAuthProvider.Google);
}

export async function signInWithApple(): Promise<void> {
  await performOAuth(OAuthProvider.Apple);
}

// ─── Timeout helper ───────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Operation timed out")), ms)
    ),
  ]);
}

// ─── Fetch current user ───────────────────────────

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    // Get user with 5-second timeout to avoid splash screen freeze
    const user = await withTimeout(account.get(), 5000);

    let photo: string | null =
      (user.prefs as Record<string, string>)?.photoUrl ?? null;

    let provider: UserProfile["provider"] = "apple";

    // Skip profile enrichment on app startup to avoid delays
    // Just identify provider quickly
    try {
      const { identities } = (await withTimeout(account.listIdentities(), 3000)) as {
        identities: Array<{
          provider: string;
          providerAccessToken?: string;
        }>;
      };

      const googleIdentity = identities.find(
        (identity) => identity.provider === "google"
      );

      if (googleIdentity) {
        provider = "google";
        // Don't fetch Google profile picture on app startup to avoid delays
        // It will be fetched on-demand or refreshed later
      } else if (identities.some((identity) => identity.provider === "apple")) {
        provider = "apple";
      }
    } catch {
      // Ignore identity errors — user is still authenticated
    }

    return {
      id: user.$id,
      name: user.name || "User",
      email: user.email,
      photo,
      provider,
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}

// ─── Logout ───────────────────────────────────────

export async function logout(): Promise<void> {
  try {
    await account.deleteSession("current");
  } catch {
    // Ignore expired session errors
  }
}