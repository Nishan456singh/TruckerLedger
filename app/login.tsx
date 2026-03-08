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

import React, { useState } from "react";

import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  View
} from "react-native";

import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

import { SafeAreaView } from "react-native-safe-area-context";

const loginBg = require("@/assets/images/login.png");
const logo = require("@/assets/images/icon.png");

export default function LoginScreen() {
  const { signInGoogle, signInApple } = useAuth();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const anyLoading = googleLoading || appleLoading;

  // ─── Google Login ─────────────────────────────────────

  async function handleGoogleSignIn() {
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
  }

  // ─── Apple Login ─────────────────────────────────────

  async function handleAppleSignIn() {
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
  }

  return (
    <ImageBackground
      source={loginBg}
      style={styles.container}
      resizeMode="cover"
      blurRadius={6}
    >
      <View style={styles.overlay} pointerEvents="none" />

      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1 }} />

        {/* Branding */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.brandSection}
        >
          <Image source={logo} style={styles.logoImage} />

          <Text style={styles.tagline}>
            Track every mile & expense
          </Text>
        </Animated.View>

        {/* Feature Pills */}
        <Animated.View
          entering={FadeInDown.delay(260).springify()}
          style={styles.pillRow}
        >
          {["⛽ Fuel", "🛣️ Tolls", "🔧 Repairs", "📎 Receipts"].map(
            (label) => (
              <View key={label} style={styles.pill}>
                <Text style={styles.pillText}>{label}</Text>
              </View>
            )
          )}
        </Animated.View>

        <View style={{ flex: 1.2 }} />

        {/* CTA */}
        <Animated.View
          entering={FadeInUp.delay(360).springify()}
          style={styles.ctaSection}
        >
          {errorMsg && (
            <Animated.View
              entering={FadeIn.duration(250)}
              style={styles.errorBanner}
            >
              <Text style={styles.errorText}>{errorMsg}</Text>
            </Animated.View>
          )}

          {/* Apple Sign In (required if Google login exists) */}

          {Platform.OS === "ios" && (
            <View style={{ height: 50 }}>
              {appleLoading ? (
                <View style={styles.appleLoading}>
                  <ActivityIndicator color="#000" />
                </View>
              ) : (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={
                    AppleAuthentication.AppleAuthenticationButtonType
                      .SIGN_IN
                  }
                  buttonStyle={
                    AppleAuthentication.AppleAuthenticationButtonStyle
                      .BLACK
                  }
                  cornerRadius={BorderRadius.md}
                  style={{ width: "100%", height: 50 }}
                  onPress={handleAppleSignIn}
                />
              )}
            </View>
          )}

          {/* Google Button */}

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
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,12,18,0.62)",
  },

  safe: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },

  brandSection: {
    alignItems: "center",
    gap: Spacing.md,
  },

  logoImage: {
    width: 240,
    height: 240,
    borderRadius: BorderRadius.xxl,
  },

  appName: {
    fontSize: FontSize.title + 4,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },

  tagline: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
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
    paddingHorizontal: Spacing.md + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  pillText: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },

  ctaSection: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  errorBanner: {
    backgroundColor: Colors.danger + "20",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.danger + "50",
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
    color: Colors.textMuted,
    textAlign: "center",
  },

  legalLink: {
    color: Colors.textSecondary,
    textDecorationLine: "underline",
  },
});