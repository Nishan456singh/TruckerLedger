import { Account, Client, OAuthProvider } from 'appwrite';

const client = new Client()
  .setEndpoint(
    process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
  )
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? '');

export const account = new Account(client);
export { OAuthProvider };
