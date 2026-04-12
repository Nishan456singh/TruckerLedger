import { getShadow } from "@/constants/shadowUtils";
import {
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
  Spacing,
} from "@/constants/theme";

import * as Haptics from "expo-haptics";

import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "accent" | "danger" | "ghost" | "card";
  size?: "sm" | "md" | "lg";
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
  variant = "primary",
  size = "md",
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
    scale.value = withSpring(0.95);
  }

  function handlePressOut() {
    scale.value = withSpring(1);
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
          size="small"
          color={variant === "ghost" ? "#6FA0C8" : "#FFFFFF"}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },

  fullWidth: {
    width: "100%",
  },

  /* ───────── BUTTON VARIANTS ───────── */

  primary: {
    backgroundColor: "#5A8FB5",
    ...getShadow(Shadow.button),
  },

  accent: {
    backgroundColor: "#6FA0C8",
    ...getShadow(Shadow.accent),
  },

  danger: {
    backgroundColor: "#E5484D",
  },

  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    ...getShadow(Shadow.card),
  },

  /* ───────── SIZES ───────── */

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

  /* ───────── LABELS ───────── */

  label: {
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.4,
  },

  labelSize_sm: {
    fontSize: FontSize.caption,
  },

  labelSize_md: {
    fontSize: FontSize.body,
  },

  labelSize_lg: {
    fontSize: FontSize.section - 2,
  },

  labelColor_primary: {
    color: "#FFFFFF",
  },

  labelColor_accent: {
    color: "#FFFFFF",
  },

  labelColor_danger: {
    color: "#FFFFFF",
  },

  labelColor_ghost: {
    color: "#A9B4C2",
  },

  labelColor_card: {
    color: "#E6EAF0",
  },
});