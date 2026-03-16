import { Account, Client, Functions, OAuthProvider } from "appwrite";

// ─── Appwrite Configuration ───────────────────────

// Hard-code values to avoid TestFlight env issues
const endpoint = "https://sfo.cloud.appwrite.io/v1";
const projectId = "69abde4e001a67d788ab"; // ← YOUR PROJECT ID

// ─── Appwrite Client ──────────────────────────────

export const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

// ─── Services ─────────────────────────────────────

export const account = new Account(client);
export const appwriteFunctions = new Functions(client);

// Re-export OAuth provider enum
export { OAuthProvider };
