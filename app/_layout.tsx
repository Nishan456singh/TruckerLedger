import { Colors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/lib/auth/AuthContext";
import { initDatabase } from "@/lib/db";
import { hasCompletedOnboarding } from "@/lib/onboardingStorage";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Animated, { FadeOut } from "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

// ─── Auth gate ─────────────────────────────────────

function AuthGate({ dbReady }: { dbReady: boolean }) {
  const { user, authLoading } = useAuth();
  const segments = useSegments();
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  const [completedOnboarding, setCompletedOnboarding] = useState(false);
  const [routedOnce, setRoutedOnce] = useState(false);

  // Check onboarding status when user changes
  useEffect(() => {
    async function checkOnboarding() {
      if (!user) {
        setOnboardingLoaded(true);
        return;
      }

      try {
        const completed = await hasCompletedOnboarding();
        setCompletedOnboarding(completed);
      } catch (err) {
        console.error("Error checking onboarding:", err);
        setCompletedOnboarding(false);
      } finally {
        setOnboardingLoaded(true);
      }
    }

    checkOnboarding();
  }, [user]);

  // Handle routing based on auth and onboarding state
  useEffect(() => {
    // Wait for all data to load before routing
    if (!dbReady || authLoading || !onboardingLoaded || routedOnce) {
      return;
    }

    const currentSegment = segments?.[0];

    // No user: should be on login
    if (!user) {
      if (currentSegment !== "login") {
        router.replace("/login");
        setRoutedOnce(true);
      }
      return;
    }

    // User exists and on login screen: navigate away
    if (currentSegment === "login") {
      if (completedOnboarding) {
        router.replace("/");
      } else {
        router.replace("/onboarding-welcome");
      }
      setRoutedOnce(true);
      return;
    }

    // User exists but hasn't completed onboarding
    if (!completedOnboarding && currentSegment !== "onboarding-welcome") {
      router.replace("/onboarding-welcome");
      setRoutedOnce(true);
      return;
    }

    // User exists, completed onboarding, and not on main tabs
    if (completedOnboarding && currentSegment !== "(tabs)") {
      router.replace("/");
      setRoutedOnce(true);
      return;
    }

    // All conditions met, routing is correct
    setRoutedOnce(true);
  }, [dbReady, authLoading, onboardingLoaded, user, completedOnboarding, segments, routedOnce]);

  return null;
}

// ─── Inner layout ──────────────────────────────────

function RootLayoutInner() {
  const [dbReady, setDbReady] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        await SplashScreen.hideAsync();
        // Keep splash visible briefly for smooth transition
        await new Promise(resolve => setTimeout(resolve, 400));
      } catch (err) {
        console.error("DB init failed:", err);
        // Hide splash even on error
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.error("Failed to hide splash screen:", e);
        }
      } finally {
        setSplashVisible(false);
        // Set dbReady last to allow Stack Navigator to render
        setDbReady(true);
      }
    }

    setup();
  }, []);

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: Colors.background }}
    >
      {/* Animated Splash Screen */}
      {splashVisible && (
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            backgroundColor: Colors.background,
            justifyContent: "center",
            alignItems: "center",
          }}
          exiting={FadeOut.duration(600)}
        >
          <Animated.Image
            source={require("../assets/images/splash.png")}
            style={{
              width: 200,
              height: 200,
              resizeMode: "contain",
            }}
          />
        </Animated.View>
      )}

      <StatusBar style="dark" />

      {dbReady && (
        <>
          <AuthGate dbReady={dbReady} />

          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: "slide_from_right",
            }}
            initialRouteName="login"
          >
        <Stack.Screen name="(tabs)" />

        <Stack.Screen
          name="login"
          options={{ animation: "fade" }}
        />

        <Stack.Screen
          name="onboarding-welcome"
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

        <Stack.Screen name="fuel-stats" />

        <Stack.Screen name="scan-receipt" />

        <Stack.Screen name="scan-bol" />

        <Stack.Screen name="bol-history" />

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
        </>
      )}
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