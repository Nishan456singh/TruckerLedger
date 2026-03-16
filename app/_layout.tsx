import { Colors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/lib/auth/AuthContext";
import { initDatabase } from "@/lib/db";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

// ─── Auth gate ─────────────────────────────────────

function AuthGate({ dbReady }: { dbReady: boolean }) {
  const { user, authLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!dbReady || authLoading) return;

    const segment = segments?.[0];
    const onLoginScreen = segment === "login";

    if (!user && !onLoginScreen) {
      router.replace("/login");
    }

    if (user && onLoginScreen) {
      router.replace("/");
    }
  }, [user, authLoading, dbReady, segments]);

  return null;
}

// ─── Inner layout ──────────────────────────────────

function RootLayoutInner() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
      } catch (err) {
        console.error("DB init failed:", err);
      } finally {
        setDbReady(true);
      }
    }

    setup();
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      <StatusBar style="light" />

      <AuthGate dbReady={dbReady} />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />

        <Stack.Screen
          name="login"
          options={{ animation: "fade" }}
        />

        <Stack.Screen name="profile" />

        <Stack.Screen
          name="add-expense"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />

        <Stack.Screen name="expense-history" />

        <Stack.Screen name="monthly-summary" />

        <Stack.Screen name="monthly-report" />

        <Stack.Screen name="receipts" />

        <Stack.Screen name="trip-profit" />

        <Stack.Screen name="expense-detail" />

        <Stack.Screen
          name="oauth/success"
          options={{ animation: "none" }}
        />

        <Stack.Screen
          name="oauth/failure"
          options={{ animation: "none" }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

// ─── Root layout ───────────────────────────────────

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}