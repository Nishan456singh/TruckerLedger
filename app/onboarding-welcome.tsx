import { Colors, FontSize, FontWeight } from '@/constants/theme';
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
      <View style={styles.content}>
        <Animated.View
          entering={FadeInDown}
          style={styles.textContainer}
        >
          <Animated.View style={animatedStyle}>
            <Text style={styles.appName}>TruckerLedger</Text>
          </Animated.View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: FontSize.section + 16,
    fontWeight: FontWeight.extrabold,
    color: Colors.textInverse,
    letterSpacing: 1,
  },
});
