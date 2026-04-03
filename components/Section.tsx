/**
 * Section Component
 * Reusable container for grouped content with optional title and action
 * Follows Apple HIG: Clear hierarchy, breathing space, actionable
 */

import { getShadow } from "@/constants/shadowUtils";
import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing } from "@/constants/theme";
import React, { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface SectionProps {
  // Content
  title?: string;
  subtitle?: string;
  children: ReactNode;

  // Styling
  variant?: "default" | "card" | "flat";
  shadow?: boolean;

  // Actions
  rightAction?: ReactNode;
  onRightActionPress?: () => void;

  // Layout
  gap?: number;
  padding?: number;
}

export default function Section({
  title,
  subtitle,
  children,
  variant = "default",
  shadow = false,
  rightAction,
  onRightActionPress,
  gap = Spacing.lg,
  padding = Spacing.lg,
}: SectionProps) {
  const containerStyle = getContainerStyle(variant, shadow, padding);

  return (
    <View style={[styles.section, containerStyle]}>
      {/* Header */}
      {title && (
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}
          </View>

          {rightAction && (
            <TouchableOpacity
              onPress={onRightActionPress}
              activeOpacity={0.7}
            >
              {rightAction}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Content */}
      <View style={[styles.content, { gap }]}>
        {children}
      </View>
    </View>
  );
}

function getContainerStyle(
  variant: string,
  shadow: boolean,
  padding: number
) {
  const baseStyle = {
    padding,
  };

  if (variant === "card") {
    return [
      baseStyle,
      {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.lg,
        ...(shadow && getShadow(Shadow.card)),
      },
    ];
  }

  if (variant === "flat") {
    return [
      baseStyle,
      {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
      },
    ];
  }

  // default
  return baseStyle;
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.md,
  },

  titleContainer: {
    flex: 1,
    gap: Spacing.xs,
  },

  title: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  subtitle: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  content: {
    gap: Spacing.lg,
  },
});
