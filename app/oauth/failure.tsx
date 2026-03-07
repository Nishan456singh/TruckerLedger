import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

/**
 * Handles the OAuth failure redirect on web.
 * Appwrite redirects here when the provider is not configured or the user
 * denies access. Just bounces back to the login screen.
 */
export default function OAuthFailure() {
  useEffect(() => {
    router.replace('/login');
  }, []);

  return <View style={{ flex: 1 }} />;
}
