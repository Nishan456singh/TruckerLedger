import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { account, OAuthProvider } from '../appwrite';
import type { UserProfile } from './authStorage';

// ─── URL param extraction ─────────────────────────────────────────────────────
// new URL() is unreliable for custom-scheme URLs in React Native (empty host
// confuses some JS engines). Parse the query string as a plain string instead.
function extractQueryParams(url: string): Record<string, string> {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return {};
  const query = url.slice(queryIndex + 1);
  return Object.fromEntries(
    query
      .split('&')
      .filter(Boolean)
      .map((pair) => {
        const eqIdx = pair.indexOf('=');
        const key = decodeURIComponent(eqIdx === -1 ? pair : pair.slice(0, eqIdx));
        const val = decodeURIComponent(eqIdx === -1 ? '' : pair.slice(eqIdx + 1));
        return [key, val] as [string, string];
      }),
  );
}

// ─── Internal OAuth helper ────────────────────────────────────────────────────
//
// 1. Manually build the OAuth2 token URL (avoids SDK's window.location.href
//    redirect which fails in React Native — appwrite@23 sets window.location.href
//    when window.location is detected, which React Native polyfills as read-only)
// 2. Open it in a browser via expo-web-browser
// 3. Parse the callback URL for userId + secret
// 4. Exchange them for an Appwrite session
//
// Uses distinct success/failure redirect paths so a failure from Appwrite
// (e.g. provider not configured) can be distinguished from a real credential
// callback, rather than both silently landing on the same bare scheme URL.
//
async function performOAuth(provider: OAuthProvider): Promise<void> {
  const successUrl = Linking.createURL('oauth/success');
  const failureUrl = Linking.createURL('oauth/failure');

  const endpoint =
    process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1';
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? '';

  const uri = new URL(`${endpoint}/account/tokens/oauth2/${provider}`);
  uri.searchParams.set('project', projectId);
  uri.searchParams.set('success', successUrl);
  uri.searchParams.set('failure', failureUrl);

  // ── Web ──────────────────────────────────────────────────────────────────────
  // On web, Linking.createURL returns an http:// URL. Appwrite redirects the
  // browser back to /oauth/success?userId=...&secret=... which is a real Expo
  // Router route that finishes the sign-in. Just navigate there directly.
  if (Platform.OS === 'web') {
    await Linking.openURL(uri.toString());
    return; // browser navigates away; /oauth/success route takes over
  }

  // ── Native (iOS / Android) ───────────────────────────────────────────────────
  // Linking.createURL returns a custom-scheme URL (truckerledger:// / exp://).
  // openAuthSessionAsync opens an in-app browser and intercepts the redirect
  // before the OS processes the deep link, returning the full callback URL.
  const scheme = successUrl.split(':')[0]; // e.g. "truckerledger" or "exp"

  const result = await WebBrowser.openAuthSessionAsync(
    uri.toString(),
    `${scheme}://`,
  );

  if (result.type !== 'success') {
    throw new Error('Sign-in was cancelled.');
  }

  if (result.url.includes('oauth/failure')) {
    throw new Error(
      'Sign-in failed. Make sure the Apple/Google OAuth provider is enabled ' +
        'and fully configured in your Appwrite console.',
    );
  }

  const params = extractQueryParams(result.url);
  const userId = params['userId'] ?? '';
  const secret = params['secret'] ?? '';

  if (!userId || !secret) {
    throw new Error('OAuth callback was missing credentials. Please try again.');
  }

  await account.createSession(userId, secret);
}

// ─── Public auth functions ────────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<void> {
  return performOAuth(OAuthProvider.Google);
}

export async function signInWithApple(): Promise<void> {
  return performOAuth(OAuthProvider.Apple);
}

/**
 * Fetch the currently authenticated Appwrite user and map it to UserProfile.
 * Returns null if there is no active session.
 *
 * Photo resolution order for Google sign-ins:
 *  1. Call Google's userinfo endpoint with the stored OAuth access token.
 *  2. Cache the URL in Appwrite user prefs so it survives token expiry (~1 hr).
 *  3. If the live fetch fails, fall back to the cached prefs URL.
 * For Apple sign-ins: photo is null (Apple does not provide a profile picture).
 */
export async function getAppwriteUser(): Promise<UserProfile | null> {
  try {
    const user = await account.get();

    let photo: string | null =
      (user.prefs as Record<string, string>)?.photoUrl ?? null;
    let provider: UserProfile['provider'] = 'apple';

    try {
      const { identities } = await account.listIdentities() as {
        identities: Array<{
          provider: string;
          providerAccessToken: string;
        }>;
      };

      const googleIdentity = identities.find((i) => i.provider === 'google');
      const appleIdentity  = identities.find((i) => i.provider === 'apple');

      if (googleIdentity) {
        provider = 'google';
        if (googleIdentity.providerAccessToken) {
          const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${googleIdentity.providerAccessToken}` },
          });
          if (res.ok) {
            const data = await res.json() as { picture?: string };
            if (data.picture) {
              photo = data.picture;
              // Cache so subsequent loads work after access token expiry.
              await account.updatePrefs({ ...user.prefs, photoUrl: photo });
            }
          }
          // If live fetch fails, `photo` stays as the cached prefs value (or null).
        }
      } else if (appleIdentity) {
        provider = 'apple';
      }
    } catch {
      // Identity fetch failed — continue with cached photo or null.
    }

    return {
      id: user.$id,
      name: user.name || 'User',
      email: user.email,
      photo,
      provider,
    };
  } catch {
    return null;
  }
}

/**
 * Terminate the current Appwrite session.
 */
export async function logoutAppwrite(): Promise<void> {
  try {
    await account.deleteSession('current');
  } catch {
    // Session may already be expired — treat as success
  }
}
