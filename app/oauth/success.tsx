import { account } from '@/lib/appwrite';
import { useAuth } from '@/lib/auth/AuthContext';
import { getAppwriteUser } from '@/lib/auth/appwriteAuth';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

/**
 * Handles the OAuth callback redirect on web.
 *
 * On native, expo-web-browser's openAuthSessionAsync intercepts the deep-link
 * redirect before the app navigates, so this screen is never reached.
 *
 * On web, Appwrite redirects the browser to
 *   http://localhost:8081/oauth/success?userId=...&secret=...
 * which renders this screen. It exchanges the one-time credentials for an
 * Appwrite session, then navigates to the home screen.
 */
export default function OAuthSuccess() {
  const { userId, secret } = useLocalSearchParams<{
    userId: string;
    secret: string;
  }>();
  const { signIn } = useAuth();

  useEffect(() => {
    async function finish() {
      if (!userId || !secret) {
        router.replace('/login');
        return;
      }
      try {
        await account.createSession(userId, secret);
        const user = await getAppwriteUser();
        if (user) {
          await signIn(user);
          router.replace('/');
        } else {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      }
    }
    finish();
  }, [userId, secret]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}
