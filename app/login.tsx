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
    View,
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
      {/* Base dark overlay */}
      <View style={styles.overlay} pointerEvents="none" />
      {/* Extra vignette at bottom for button readability */}
      <View style={styles.overlayBottom} pointerEvents="none" />

      <SafeAreaView style={styles.safe}>
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
    backgroundColor: Colors.overlay,
  },

  overlayBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
    backgroundColor: "rgba(11, 18, 32, 0.72)",
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
    borderColor: Colors.border,
  },

  logoImage: {
    width: 240,
    height: 240,
    borderRadius: BorderRadius.xxl,
  },

  tagline: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
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
    backgroundColor: Colors.cardStrong,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  pillText: {
    fontSize: FontSize.caption,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },

  ctaCard: {
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.cardStrong,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
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
});
