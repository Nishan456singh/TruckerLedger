import { Colors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/lib/auth/AuthContext";
import { initDatabase } from "@/lib/db";
import { hasCompletedOnboarding } from "@/lib/onboardingStorage";
import { Stack, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Animated, { FadeOut } from "react-native-reanimated";

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

const AUTH_ROUTES = new Set(["login", "oauth"]);
const ONBOARDING_ROUTE = "onboarding-welcome";
const APP_ROUTES = new Set([
  "(tabs)",
  "add-expense",
  "analytics",
  "bol-history",
  "cloud-settings",
  "expense-detail",
  "expense-history",
  "fuel-stats",
  "history",
  "monthly-report",
  "monthly-summary",
  "profile",
  "receipts",
  "scan-receipt",
  "trip-profit",
]);

function AuthGate({ dbReady }: { dbReady: boolean }) {
  const { user, authLoading } = useAuth();
  const segments = useSegments();

  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  const [completedOnboarding, setCompletedOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkOnboarding() {
      if (!user) {
        if (!cancelled) {
          setCompletedOnboarding(false);
          setOnboardingLoaded(true);
        }
        return;
      }

      try {
        const completed = await hasCompletedOnboarding();

        if (!cancelled) {
          setCompletedOnboarding(completed);
        }
      } catch (err) {
        console.error("Error checking onboarding:", err);

        if (!cancelled) {
          setCompletedOnboarding(false);
        }
      } finally {
        if (!cancelled) {
          setOnboardingLoaded(true);
        }
      }
    }

    setOnboardingLoaded(false);
    void checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const currentSegment = useMemo(() => segments?.[0] ?? "", [segments]);

  useEffect(() => {
    if (!dbReady || authLoading || !onboardingLoaded) {
      return;
    }

    const isAuthRoute = AUTH_ROUTES.has(currentSegment);
    const isOnboardingRoute = currentSegment === ONBOARDING_ROUTE;
    const isKnownAppRoute = APP_ROUTES.has(currentSegment);
    const isRoot = !currentSegment;

    if (!user) {
      if (!isAuthRoute) {
        router.replace("/login");
      }
      return;
    }

    if (!completedOnboarding) {
      if (!isOnboardingRoute) {
        router.replace("/onboarding-welcome");
      }
      return;
    }

    if (isAuthRoute || isOnboardingRoute) {
      router.replace("/");
      return;
    }

    if (!isRoot && !isKnownAppRoute) {
      router.replace("/");
    }
  }, [authLoading, completedOnboarding, currentSegment, dbReady, onboardingLoaded, user]);

  return null;
}

function RootLayoutInner() {
  const [dbReady, setDbReady] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function setup() {
      try {
        await initDatabase();
      } catch (err) {
        console.error("DB init failed:", err);
      } finally {
        try {
          await SplashScreen.hideAsync();
        } catch (hideErr) {
          console.error("Failed to hide native splash screen:", hideErr);
        }

        if (!mounted) {
          return;
        }

        setDbReady(true);

        setTimeout(() => {
          if (mounted) {
            setSplashVisible(false);
          }
        }, 350);
      }
    }

    void setup();

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
          contentStyle: { backgroundColor: Colors.background },
          animation: "slide_from_right",
        }}
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

        <Stack.Screen
          name="add-expense"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />

        <Stack.Screen name="analytics" />
        <Stack.Screen name="bol-history" />
        <Stack.Screen name="cloud-settings" />
        <Stack.Screen name="expense-detail" />
        <Stack.Screen name="expense-history" />
        <Stack.Screen name="fuel-stats" />
        <Stack.Screen name="history" />
        <Stack.Screen name="monthly-report" />
        <Stack.Screen name="monthly-summary" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="receipts" />
        <Stack.Screen name="scan-receipt" />
        <Stack.Screen name="trip-profit" />

        <Stack.Screen
          name="oauth/success"
          options={{ animation: "none" }}
        />
        <Stack.Screen
          name="oauth/failure"
          options={{ animation: "none" }}
        />
      </Stack>

      {splashVisible && (
        <Animated.View style={styles.splashOverlay} exiting={FadeOut.duration(450)}>
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

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  splashImage: {
    width: 200,
    height: 200,
  },
});