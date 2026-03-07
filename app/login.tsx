import GoogleSignInButton from '@/components/GoogleSignInButton';
import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Spacing,
} from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthContext';
import {
    getAppwriteUser,
    signInWithApple,
    signInWithGoogle,
} from '@/lib/auth/appwriteAuth';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const loginBg = require('@/assets/images/login.png');

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  // ─── Google ──────────────────────────────────────────────────────────────────
  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      const user = await getAppwriteUser();
      if (user) await signIn(user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      if (msg !== 'Sign-in was cancelled.') setErrorMsg(msg);
    } finally {
      setGoogleLoading(false);
    }
  }

  // ─── Apple ───────────────────────────────────────────────────────────────────
  async function handleAppleSignIn() {
    setAppleLoading(true);
    setErrorMsg(null);
    try {
      await signInWithApple();
      const user = await getAppwriteUser();
      if (user) await signIn(user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Apple sign-in failed.';
      if (msg !== 'Sign-in was cancelled.') setErrorMsg(msg);
    } finally {
      setAppleLoading(false);
    }
  }

  const anyLoading = googleLoading || appleLoading;

  return (
    <ImageBackground source={loginBg} style={styles.container} resizeMode="cover">
      <View style={styles.overlay} pointerEvents="none" />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={{ flex: 1 }} />

        {/* Branding */}
        <Animated.View
          entering={FadeInDown.delay(100).springify().damping(16)}
          style={styles.brandSection}
        >
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🚛</Text>
          </View>
          <Text style={styles.appName}>TruckLedger</Text>
          <Text style={styles.tagline}>Track every mile & expense</Text>
        </Animated.View>

        {/* Feature pills */}
        <Animated.View
          entering={FadeInDown.delay(260).springify().damping(16)}
          style={styles.pillRow}
        >
          {['⛽ Fuel', '🛣️ Tolls', '🔧 Repairs', '📎 Receipts'].map((label) => (
            <View key={label} style={styles.pill}>
              <Text style={styles.pillText}>{label}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={{ flex: 1.2 }} />

        {/* CTA section */}
        <Animated.View
          entering={FadeInUp.delay(360).springify().damping(16)}
          style={styles.ctaSection}
        >
          {errorMsg && (
            <Animated.View entering={FadeIn.duration(250)} style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </Animated.View>
          )}

          {/*
           * App Store Guideline 4.8: if the app offers third-party login,
           * Sign in with Apple must also be offered and shown prominently on iOS.
           */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.appleButton, anyLoading && styles.buttonDisabled]}
              onPress={handleAppleSignIn}
              disabled={anyLoading}
              activeOpacity={0.85}
            >
              {appleLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Text style={styles.appleButtonIcon}></Text>
                  <Text style={styles.appleButtonText}>Sign in with Apple</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <GoogleSignInButton
            onPress={handleGoogleSignIn}
            loading={googleLoading}
            disabled={anyLoading}
          />

          <Text style={styles.legal}>
            By continuing you agree to our{' '}
            <Text style={styles.legalLink}>Terms</Text>
            {' & '}
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
    backgroundColor: 'rgba(10, 12, 18, 0.62)',
  },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },

  // Brand
  brandSection: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.xxl,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 42,
  },
  appName: {
    fontSize: FontSize.title + 4,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: Spacing.sm,
  },
  tagline: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },

  // Feature pills
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
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

  // CTA
  ctaSection: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  errorBanner: {
    backgroundColor: Colors.danger + '20',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.danger + '50',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    fontSize: FontSize.caption,
    color: Colors.danger,
    fontWeight: FontWeight.medium,
    textAlign: 'center',
  },

  // Apple button (follows Apple HIG: black fill, white text)
  appleButton: {
    height: 50,
    borderRadius: BorderRadius.md,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  appleButtonIcon: {
    fontSize: 18,
    color: '#fff',
    lineHeight: 22,
  },
  appleButtonText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: '#fff',
    letterSpacing: 0.2,
  },

  // Guest button
  buttonDisabled: {
    opacity: 0.5,
  },

  // Legal
  legal: {
    fontSize: FontSize.small,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
  legalLink: {
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
