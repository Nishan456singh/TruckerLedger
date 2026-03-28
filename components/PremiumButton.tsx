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

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; text: string; shadowKey: keyof typeof Shadow }> = {
  primary: { bg: Colors.primary, text: Colors.textPrimary, shadowKey: 'button' },
  secondary: { bg: Colors.secondary, text: Colors.textInverse, shadowKey: 'accent' },
  accent: { bg: Colors.secondary, text: Colors.textInverse, shadowKey: 'accent' },
  danger: { bg: Colors.danger, text: Colors.textInverse, shadowKey: 'danger' },
  outline: { bg: 'transparent', text: Colors.primary, shadowKey: 'card' },
};

const SIZE_STYLES: Record<ButtonSize, { height: number; paddingH: number; fontSize: number }> = {
  small: { height: 40, paddingH: Spacing.md, fontSize: FontSize.caption },
  medium: { height: 52, paddingH: Spacing.lg, fontSize: FontSize.body },
  large: { height: 60, paddingH: Spacing.xl, fontSize: FontSize.body },
};

interface PremiumButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export default function PremiumButton({
  label,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  fullWidth = false,
}: PremiumButtonProps) {
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

  const sizeStyle = SIZE_STYLES[size];
  const variantStyle = VARIANT_STYLES[variant];

  const buttonStyle = useMemo(() => {
    const isOutline = variant === 'outline';
    return [
      styles.button,
      {
        height: sizeStyle.height,
        paddingHorizontal: sizeStyle.paddingH,
        backgroundColor: variantStyle.bg,
        borderWidth: isOutline ? 2 : 0,
        borderColor: isOutline ? Colors.primary : 'transparent',
      },
      fullWidth && { width: '100%' },
      disabled && styles.disabled,
    ];
  }, [variant, size, disabled, fullWidth, sizeStyle, variantStyle]);

  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled || loading}
        style={[
          buttonStyle,
          !disabled && (variant === 'outline' ? {} : Shadow[variantStyle.shadowKey]),
        ]}
      >
        {loading ? (
          <ActivityIndicator color={variantStyle.text} size="small" />
        ) : (
          <>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text
              style={[
                styles.label,
                {
                  fontSize: sizeStyle.fontSize,
                  color: variantStyle.text,
                },
              ]}
            >
              {label}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: FontSize.body,
  },
  label: {
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
});
