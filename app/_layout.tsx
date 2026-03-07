import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';
import { initDatabase } from '@/lib/db';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

// ─── Auth gate: redirects based on session state ───────────────────────────

function AuthGate({ dbReady }: { dbReady: boolean }) {
  const { user, authLoading } = useAuth();
  const segments = useSegments();
  const redirected = useRef(false);

  useEffect(() => {
    if (!dbReady || authLoading) return;

    const onLoginScreen = segments[0] === 'login';

    if (!user && !onLoginScreen) {
      redirected.current = true;
      router.replace('/login');
    } else if (user && onLoginScreen) {
      redirected.current = true;
      router.replace('/');
    }
  }, [user, authLoading, dbReady, segments]);

  return null;
}

// ─── Inner layout — must be inside AuthProvider to call useAuth ────────────

function RootLayoutInner() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('DB init failed:', err);
        // Mark ready anyway so the app doesn't hang
        setDbReady(true);
      });
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar style="light" />
      <AuthGate dbReady={dbReady} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{ headerShown: false, animation: 'fade' }}
        />
        <Stack.Screen
          name="profile"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="add-expense"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="scan-receipt"
          options={{
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="expense-history"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="expense-detail"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="oauth/success"
          options={{ headerShown: false, animation: 'none' }}
        />
        <Stack.Screen
          name="oauth/failure"
          options={{ headerShown: false, animation: 'none' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

// ─── Root export ────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}
