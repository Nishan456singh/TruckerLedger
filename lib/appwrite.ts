import { Client, Account, OAuthProvider } from "appwrite";

// ─── Environment Variables ─────────────────────────

const endpoint =
  process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ??
  "https://sfo.cloud.appwrite.io/v1";

const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "Missing EXPO_PUBLIC_APPWRITE_PROJECT_ID in environment variables"
  );
}

// ─── Appwrite Client ───────────────────────────────

export const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

// ─── Services ──────────────────────────────────────

export const account = new Account(client);

// Re-export OAuth provider enum for auth file
export { OAuthProvider };