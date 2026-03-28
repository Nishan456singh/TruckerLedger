import { BorderRadius, Colors, Shadow, Spacing } from '@/constants/theme';
import React from 'react';
import {
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';

interface FloatingCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  innerPadding?: number;
}

export default function FloatingCard({
  children,
  style,
  elevated = true,
  innerPadding = Spacing.lg,
}: FloatingCardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated ? Shadow.cardElevated : Shadow.card,
        { padding: innerPadding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
});
