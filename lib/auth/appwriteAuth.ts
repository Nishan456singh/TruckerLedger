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

// ─── Fetch current user ───────────────────────────

export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const user = await account.get();

    let photo: string | null =
      (user.prefs as Record<string, string>)?.photoUrl ?? null;

    let provider: UserProfile["provider"] = "apple";

    try {
      const { identities } = (await account.listIdentities()) as {
        identities: Array<{
          provider: string;
          providerAccessToken?: string;
        }>;
      };

      const googleIdentity = identities.find(
        (identity) => identity.provider === "google"
      );

      const appleIdentity = identities.find(
        (identity) => identity.provider === "apple"
      );

      if (googleIdentity) {
        provider = "google";

        if (googleIdentity.providerAccessToken) {
          const res = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
              headers: {
                Authorization: `Bearer ${googleIdentity.providerAccessToken}`,
              },
            }
          );

          if (res.ok) {
            const data = await res.json();

            if (data.picture) {
              photo = data.picture;

              await account.updatePrefs({
                ...user.prefs,
                photoUrl: photo,
              });
            }
          }
        }
      } else if (appleIdentity) {
        provider = "apple";
      }
    } catch {
      // Ignore identity/profile enrichment errors
    }

    return {
      id: user.$id,
      name: user.name || "User",
      email: user.email,
      photo,
      provider,
    };
  } catch {
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