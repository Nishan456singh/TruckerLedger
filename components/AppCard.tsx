/**
 * AppCard Component
 * Elevation, spacing, and visual hierarchy for card-based content
 * Apple HIG compliant: Clear visual distinction, appropriate padding
 */

import { getShadow } from "@/constants/shadowUtils";
import {
    BorderRadius,
    Colors,
    Shadow,
    Spacing,
} from "@/constants/theme";
import { ReactNode } from "react";
import {
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

interface AppCardProps {
  children: ReactNode;
  onPress?: () => void;
  variant?: "elevated" | "flat" | "outlined";
  padding?: number;
  borderRadius?: number;
  style?: ViewStyle;
  activeOpacity?: number;
  disabled?: boolean;
}

export default function AppCard({
  children,
  onPress,
  variant = "elevated",
  padding = Spacing.lg,
  borderRadius = BorderRadius.lg,
  style,
  activeOpacity = 0.7,
  disabled = false,
}: AppCardProps) {
  const Container = onPress && !disabled ? TouchableOpacity : View;

  const containerProps: any = {
    style: [
      styles.card,
      getVariantStyle(variant),
      {
        padding,
        borderRadius,
      },
      style,
    ],
    ...(onPress && !disabled && {
      onPress,
      activeOpacity,
    }),
  };

  return <Container {...containerProps}>{children}</Container>;
}

function getVariantStyle(variant: string) {
  switch (variant) {
    case "elevated":
      return {
        backgroundColor: Colors.card,
        ...getShadow(Shadow.card),
      };

    case "flat":
      return {
        backgroundColor: Colors.surface,
      };

    case "outlined":
      return {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: Colors.borderLight,
      };

    default:
      return {
        backgroundColor: Colors.card,
        ...getShadow(Shadow.card),
      };
  }
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
});
