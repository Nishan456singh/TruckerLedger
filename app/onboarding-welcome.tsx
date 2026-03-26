import PrimaryButton from '@/components/PrimaryButton';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { markOnboardingCompleted } from '@/lib/onboardingStorage';
import { router } from 'expo-router';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height } = Dimensions.get('window');

interface OnboardingStep {
  icon: string;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  {
    icon: '🧾',
    title: 'Scan Receipts',
    description: 'Use OCR to automatically capture expense data from your receipts. No manual typing needed.',
  },
  {
    icon: '🚚',
    title: 'Track Trip Profit',
    description: 'Log each trip with income and expenses. See your profitability at a glance.',
  },
  {
    icon: '📊',
    title: 'View Insights',
    description: 'Get monthly analytics including best trips, profitability rates, and spending trends.',
  },
  {
    icon: '📄',
    title: 'Scan BOLs',
    description: 'Capture pickup/delivery locations and load amounts automatically with OCR.',
  },
];

interface WelcomeScreenProps {
  onComplete: () => void;
}

export default function WelcomeScreen() {
  const [currentStep, setCurrentStep] = React.useState(0);

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await markOnboardingCompleted();
      router.replace('/');
    }
  };

  const handleSkip = async () => {
    await markOnboardingCompleted();
    router.replace('/');
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {/* Step Content */}
        <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.content}>
          <Text style={styles.stepIcon}>{step.icon}</Text>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
        </Animated.View>

        {/* Indicators */}
        <View style={styles.indicators}>
          {steps.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.indicator,
                idx === currentStep && styles.indicatorActive,
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <PrimaryButton label="Next →" onPress={handleNext} />
          <Text style={styles.skipButton} onPress={handleSkip}>
            Skip for now
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    justifyContent: 'space-between',
  },
  progressContainer: {
    height: 4,
    backgroundColor: Colors.card,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.xxxl,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: height * 0.35,
    gap: Spacing.lg,
  },
  stepIcon: {
    fontSize: 72,
    marginBottom: Spacing.md,
  },
  stepTitle: {
    fontSize: FontSize.section + 4,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.xxxl,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.card,
  },
  indicatorActive: {
    backgroundColor: Colors.primary,
    width: 28,
  },
  buttonsContainer: {
    gap: Spacing.lg,
  },
  skipButton: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    padding: Spacing.md,
  },
});
