import { BorderRadius, Colors, Shadow, Spacing } from '@/constants/theme';
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
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    ...Shadow.card,
  },
  padded: {
    padding: Spacing.lg,
  },
});