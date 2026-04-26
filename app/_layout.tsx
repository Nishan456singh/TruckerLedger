import { Colors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/lib/auth/AuthContext";
import { initDatabase } from "@/lib/db";
import { hasCompletedOnboarding } from "@/lib/onboardingStorage";

import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Image, StyleSheet } from "react-native";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { FadeOut } from "react-native-reanimated";

void SplashScreen.preventAutoHideAsync();

/* =========================================================
ROUTE CONSTANTS
========================================================= */

const AUTH_ROUTES = ["login"];
const PUBLIC_ROUTES = ["login", "legal"];
const ONBOARDING_ROUTE = "onboarding-welcome";

/* =========================================================
AUTH GATE
========================================================= */

function AuthGate({ dbReady }: { dbReady: boolean }) {
  const { user, authLoading } = useAuth();
  const segments = useSegments();

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [completedOnboarding, setCompletedOnboarding] = useState(false);

  const currentRoute = segments[0];

  /* ---------- Check onboarding ---------- */

  useEffect(() => {
    let mounted = true;

    async function check() {
      if (!user) {
        setCompletedOnboarding(false);
        setOnboardingChecked(true);
        return;
      }

      try {
        const completed = await hasCompletedOnboarding();

        if (mounted) {
          setCompletedOnboarding(completed);
        }
      } catch (err) {
        console.error("Onboarding check failed:", err);
      } finally {
        if (mounted) setOnboardingChecked(true);
      }
    }

    check();

    return () => {
      mounted = false;
    };
  }, [user]);

  /* ---------- Navigation logic ---------- */

  useEffect(() => {
    if (!dbReady || authLoading || !onboardingChecked) return;

    const isAuthRoute = AUTH_ROUTES.includes(currentRoute);
    const isPublicRoute = PUBLIC_ROUTES.includes(currentRoute);
    const isOnboarding = currentRoute === ONBOARDING_ROUTE;

    /* ---------- Not logged in ---------- */

    if (!user) {
      if (!isPublicRoute) {
        router.replace("/login");
      }
      return;
    }

    /* ---------- Onboarding ---------- */

    if (!completedOnboarding) {
      if (!isOnboarding) {
        router.replace("/onboarding-welcome");
      }
      return;
    }

    /* ---------- Logged in ---------- */

    if (isAuthRoute || isOnboarding) {
      router.replace("/");
    }
  }, [
    authLoading,
    completedOnboarding,
    currentRoute,
    dbReady,
    onboardingChecked,
    user,
  ]);

  return null;
}

/* =========================================================
APP LAYOUT
========================================================= */

function RootLayoutInner() {
  const [dbReady, setDbReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  /* ---------- Initialize DB ---------- */

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        await initDatabase();
      } catch (err) {
        console.error("Database init failed:", err);
      }

      try {
        await SplashScreen.hideAsync();
      } catch {}

      if (!mounted) return;

      setDbReady(true);

      setTimeout(() => {
        if (mounted) setShowSplash(false);
      }, 350);
    }

    setup();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      {dbReady && <AuthGate dbReady={dbReady} />}

      <StatusBar style="light" />

      <Stack
        initialRouteName="login"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        {/* Main App */}
        <Stack.Screen name="(tabs)" />

        {/* Auth */}
        <Stack.Screen name="login" options={{ animation: "fade" }} />
        <Stack.Screen name="legal/[type]" options={{ animation: "slide_from_right" }} />

        {/* Onboarding */}
        <Stack.Screen
          name="onboarding-welcome"
          options={{ animation: "fade" }}
        />

        {/* Modals */}
        <Stack.Screen
          name="add-expense"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />

        {/* Screens */}
        <Stack.Screen name="history" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="receipts" />
        <Stack.Screen name="scan-receipt" />
        <Stack.Screen name="scan-bol" />
        <Stack.Screen name="expense-detail" />
        <Stack.Screen name="bol-detail" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="monthly-summary" />
        <Stack.Screen name="monthly-report" />
        <Stack.Screen name="trip-profit" />
        <Stack.Screen name="fuel-stats" />
        <Stack.Screen name="cloud-settings" />

        {/* OAuth */}
        <Stack.Screen name="oauth/success" options={{ animation: "none" }} />
        <Stack.Screen name="oauth/failure" options={{ animation: "none" }} />
      </Stack>

      {/* Custom Splash Overlay */}

      {showSplash && (
        <Animated.View
          style={styles.splashOverlay}
          exiting={FadeOut.duration(450)}
        >
          <Image
            source={require("../assets/images/splash.png")}
            style={styles.splashImage}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

/* =========================================================
ROOT EXPORT
========================================================= */

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}

/* =========================================================
STYLES
========================================================= */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },

  splashImage: {
    width: 200,
    height: 200,
  },
});