import { getShadow } from '@/constants/shadowUtils';
import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'danger' | 'ghost' | 'card';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = true,
}: PrimaryButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }

  async function handlePress() {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }

  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    styles[`labelSize_${size}`],
    styles[`labelColor_${variant}`],
    textStyle,
  ];

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      disabled={disabled || loading}
      style={[animatedStyle, buttonStyle]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'ghost'
              ? Colors.primary
              : variant === 'primary' || variant === 'accent'
                ? Colors.background
                : Colors.textPrimary
          }
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={labelStyle}>{label}</Text>
        </>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  fullWidth: {
    width: '100%',
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary,
    ...getShadow(Shadow.button),
  },
  accent: {
    backgroundColor: Colors.accent,
    ...getShadow(Shadow.accent),
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  card: {
    backgroundColor: Colors.card,
    ...getShadow(Shadow.card),
  },

  // Sizes
  size_sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  size_md: {
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xl,
  },
  size_lg: {
    paddingVertical: Spacing.lg + 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },

  disabled: {
    opacity: 0.45,
  },

  label: {
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.3,
  },
  labelSize_sm: { fontSize: FontSize.caption },
  labelSize_md: { fontSize: FontSize.body },
  labelSize_lg: { fontSize: FontSize.section - 2 },

  labelColor_primary: { color: Colors.background },
  labelColor_accent: { color: Colors.background },
  labelColor_danger: { color: Colors.textPrimary },
  labelColor_ghost: { color: Colors.textSecondary },
  labelColor_card: { color: Colors.textPrimary },
});
