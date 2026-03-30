import { Colors, Spacing, TypographyScale } from "@/constants/theme";
import { markOnboardingCompleted } from "@/lib/onboardingStorage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingWelcome() {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    // ✨ Premium pulse animation (scale + opacity)
    opacity.value = withRepeat(
      withTiming(0.6, { duration: 1200 }),
      -1,
      true
    );

    scale.value = withRepeat(
      withSpring(1.05),
      -1,
      true
    );

    // ⏱ Auto navigation
    const timer = setTimeout(async () => {
      if (!mounted.current) return;

      try {
        await markOnboardingCompleted();
        router.replace("/");
      } catch (e) {
        console.error("Onboarding error:", e);
      }
    }, 2800);

    return () => {
      mounted.current = false;
      clearTimeout(timer);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <LinearGradient
      colors={["#C3224E", "#A01B3A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContent}>
          {/* 🚛 Logo / Icon */}
          <Animated.View entering={FadeInUp.springify()}>
            <Text style={styles.logo}>🚛</Text>
          </Animated.View>

          {/* Title */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.textContainer}
          >
            <Animated.View style={animatedStyle}>
              <Text style={styles.appName}>TruckerLedger</Text>
            </Animated.View>

            <Text style={styles.subtitle}>
              Track Every Mile
            </Text>

            <Text style={styles.subtitleHighlight}>
              Control Every Expense
            </Text>

            <Text style={styles.tagline}>
              Built for modern truckers who want clarity, control, and profit.
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safe: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },

  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xl,
  },

  logo: {
    fontSize: 64,
  },

  textContainer: {
    alignItems: "center",
    gap: Spacing.md,
  },

  appName: {
    ...TypographyScale.headline,
    color: Colors.textInverse,
    letterSpacing: 0.8,
    textAlign: "center",
  },

  subtitle: {
    ...TypographyScale.title,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },

  subtitleHighlight: {
    ...TypographyScale.title,
    color: Colors.textInverse,
    fontWeight: "800",
    textAlign: "center",
  },

  tagline: {
    ...TypographyScale.body,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: Spacing.md,
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
});