import { BorderRadius, Shadow, Spacing } from '@/constants/theme';
import { getShadow } from '@/constants/shadowUtils';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface HighContrastCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export default function HighContrastCard({
  children,
  style,
  padded = true,
}: HighContrastCardProps) {
  return <View style={[styles.base, padded && styles.padded, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...getShadow(Shadow.card),
  },
  padded: {
    padding: Spacing.lg,
  },
});