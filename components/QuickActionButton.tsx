import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import { SCALE_VALUES, SPRING_CONFIGS } from '@/lib/animationUtils';
import { pressHaptic } from '@/lib/hapticUtils';
import React, { useCallback, useMemo } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type ButtonVariant = 'primary' | 'secondary' | 'fuel' | 'accent' | 'food' | 'default';

const VARIANT_COLORS: Record<ButtonVariant, { bg: string; border: string; indicator: string }> = {
  primary: { bg: 'rgba(34, 197, 94, 0.08)', border: 'rgba(34, 197, 94, 0.15)', indicator: Colors.primary },
  secondary: { bg: 'rgba(56, 189, 248, 0.08)', border: 'rgba(56, 189, 248, 0.15)', indicator: Colors.accent },
  fuel: { bg: 'rgba(255, 140, 66, 0.08)', border: 'rgba(255, 140, 66, 0.15)', indicator: Colors.fuel },
  accent: { bg: 'rgba(167, 139, 250, 0.08)', border: 'rgba(167, 139, 250, 0.15)', indicator: Colors.parking },
  food: { bg: 'rgba(0, 208, 158, 0.08)', border: 'rgba(0, 208, 158, 0.15)', indicator: Colors.food },
  default: { bg: 'rgba(154, 160, 170, 0.08)', border: 'rgba(154, 160, 170, 0.15)', indicator: Colors.other },
};

interface QuickActionButtonProps {
  label: string;
  icon: string; // Emoji icon
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: ButtonVariant;
}

export default function QuickActionButton({
  label,
  icon,
  onPress,
  loading = false,
  disabled = false,
  style,
  variant = 'primary',
}: QuickActionButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(SCALE_VALUES.press, SPRING_CONFIGS.standard);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(SCALE_VALUES.normal, SPRING_CONFIGS.standard);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    pressHaptic();
    onPress();
  }, [disabled, loading, onPress]);

  const buttonStyle = useMemo(() => {
    const colors = VARIANT_COLORS[variant];
    return [
      styles.button,
      {
        backgroundColor: colors.bg,
        borderColor: colors.border,
      },
      disabled && styles.disabled,
    ];
  }, [variant, disabled]);

  const indicatorColor = useMemo(() => VARIANT_COLORS[variant].indicator, [variant]);

  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled || loading}
        style={buttonStyle}
      >
        {loading ? (
          <ActivityIndicator color={indicatorColor} size="small" />
        ) : (
          <>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.label}>{label}</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    minHeight: 56,
    minWidth: 56,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    overflow: 'hidden',
    ...Shadow.card,
  },
  disabled: {
    opacity: 0.55,
  },
  icon: {
    fontSize: 28,
  },
  label: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
