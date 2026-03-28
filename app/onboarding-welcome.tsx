import { Colors, Spacing, TypographyScale } from '@/constants/theme';
import { markOnboardingCompleted } from '@/lib/onboardingStorage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingWelcome() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Pulsing animation for the text
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 1000 }),
      -1,
      true
    );

    // Auto-advance after 3 seconds
    const timer = setTimeout(async () => {
      await markOnboardingCompleted();
      router.replace('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <LinearGradient
      colors={['#C3224E', '#A01B3A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.centerContent}>
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.textContainer}
          >
            <Animated.View style={animatedStyle}>
              <Text style={styles.appName}>TruckerLedger</Text>
            </Animated.View>

            <Text style={styles.subtitle}>
              Track Every Mile, Control Every Expense
            </Text>

            <Text style={styles.tagline}>
              Your complete ledger for trucking operations
            </Text>
          </Animated.View>
        </View>
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
    paddingHorizontal: Spacing.lg,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  appName: {
    ...TypographyScale.headline,
    color: Colors.textInverse,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    ...TypographyScale.title,
    color: Colors.textInverse,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginTop: Spacing.lg,
  },
  tagline: {
    ...TypographyScale.body,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: Spacing.md,
  },
});
