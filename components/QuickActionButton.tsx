import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { pressHaptic } from '@/lib/hapticUtils';
import { SCALE_VALUES, SPRING_CONFIGS } from '@/lib/animationUtils';
import React, { useMemo, useCallback } from 'react';
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

interface QuickActionButtonProps {
  label: string;
  icon: string; // Emoji icon
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function QuickActionButton({
  label,
  icon,
  onPress,
  loading = false,
  disabled = false,
  style,
}: QuickActionButtonProps) {
  const scale = useMemo(() => useSharedValue(1), []);

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

  return (
    <Animated.View style={[animatedStyle, style]}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled || loading}
        style={[styles.button, disabled && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="small" />
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
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    minHeight: 120,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: FontSize.largeIcon,
  },
  label: {
    fontSize: FontSize.body - 1,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
