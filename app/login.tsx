import GoogleSignInButton from "@/components/GoogleSignInButton";

import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Spacing,
} from "@/constants/theme";

import { useAuth } from "@/lib/auth/AuthContext";

import * as AppleAuthentication from "expo-apple-authentication";

import React, { useCallback, useEffect, useState } from "react";

import {
    ActivityIndicator,
    Image,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";

import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
} from "react-native-reanimated";

import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const logo = require("@/assets/images/icon.png");

const FEATURE_PILLS = ["⛽ Fuel", "🛣️ Tolls", "🔧 Repairs", "📎 Receipts"];
const ERROR_DISMISS_TIMEOUT = 5000;

export default function LoginScreen() {
  const { signInGoogle, signInApple } = useAuth();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const anyLoading = googleLoading || appleLoading;

  // Auto-dismiss errors after 5 seconds
  useEffect(() => {
    if (!errorMsg) return;
    const timer = setTimeout(() => setErrorMsg(null), ERROR_DISMISS_TIMEOUT);
    return () => clearTimeout(timer);
  }, [errorMsg]);

  // ─── Google Login ─────────────────────────────────────
  const handleGoogleSignIn = useCallback(async () => {
    if (anyLoading) return;

    setGoogleLoading(true);
    setErrorMsg(null);

    try {
      await signInGoogle();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Google sign-in failed.";

      if (msg !== "Sign-in was cancelled.") {
        setErrorMsg(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  }, [signInGoogle, anyLoading]);

  // ─── Apple Login ─────────────────────────────────────
  const handleAppleSignIn = useCallback(async () => {
    if (anyLoading) return;

    setAppleLoading(true);
    setErrorMsg(null);

    try {
      await signInApple();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Apple sign-in failed.";

      if (msg !== "Sign-in was cancelled.") {
        setErrorMsg(msg);
      }
    } finally {
      setAppleLoading(false);
    }
  }, [signInApple, anyLoading]);

  return (
    <LinearGradient
      colors={["#6FA0C8", "#5A8FB5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe} edges={["bottom"]}>
        <View style={{ flex: 1 }} />

        {/* Branding */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.brandSection}
        >
          <View style={styles.logoRing}>
            <Image source={logo} style={styles.logoImage} />
          </View>

          <Text style={styles.tagline}>Track every mile & expense</Text>
        </Animated.View>

        {/* Feature Pills */}
        <Animated.View
          entering={FadeInDown.delay(260).springify()}
          style={styles.pillRow}
        >
          {FEATURE_PILLS.map((label) => (
            <View key={label} style={styles.pill}>
              <Text style={styles.pillText}>{label}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={{ flex: 1.2 }} />

        {/* CTA Card */}
        <Animated.View
          entering={FadeInUp.delay(360).springify()}
          style={styles.ctaCard}
        >
          {errorMsg && (
            <Animated.View
              entering={FadeIn.duration(250)}
              style={styles.errorBanner}
            >
              <Text style={styles.errorText}>{errorMsg}</Text>
            </Animated.View>
          )}

          {Platform.OS === "ios" && (
            <View style={{ height: 50 }}>
              {appleLoading ? (
                <View style={styles.appleLoading}>
                  <ActivityIndicator color={Colors.background} />
                </View>
              ) : (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={
                    AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                  }
                  buttonStyle={
                    AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  }
                  cornerRadius={BorderRadius.md}
                  style={{ width: "100%", height: 50 }}
                  onPress={handleAppleSignIn}
                />
              )}
            </View>
          )}

          <GoogleSignInButton
            onPress={handleGoogleSignIn}
            loading={googleLoading}
            disabled={anyLoading}
          />

          <Text style={styles.legal}>
            By continuing you agree to our{" "}
            <Text style={styles.legalLink}>Terms</Text>
            {" & "}
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>

        <View style={styles.safeBottom} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safe: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },

  brandSection: {
    alignItems: "center",
    gap: Spacing.lg,
  },

  logoRing: {
    padding: 3,
    borderRadius: BorderRadius.xxl + 4,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  logoImage: {
    width: 240,
    height: 240,
    borderRadius: BorderRadius.xxl,
  },

  tagline: {
    fontSize: FontSize.body,
    color: Colors.textInverse,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.4,
    textAlign: "center",
  },

  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },

  pill: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },

  pillText: {
    fontSize: FontSize.caption,
    color: Colors.textInverse,
    fontWeight: FontWeight.medium,
  },

  ctaCard: {
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  errorBanner: {
    backgroundColor: Colors.danger + "22",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.danger + "55",
    padding: Spacing.sm,
    alignItems: "center",
  },

  errorText: {
    fontSize: FontSize.caption,
    color: Colors.danger,
    textAlign: "center",
  },

  appleLoading: {
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  legal: {
    fontSize: FontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
  },

  legalLink: {
    color: Colors.accent,
    textDecorationLine: "underline",
  },

  safeBottom: {
    height: Spacing.md,
  },
});
