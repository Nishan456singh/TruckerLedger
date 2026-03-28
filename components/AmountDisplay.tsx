import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';

interface AmountDisplayProps {
  amount: string | number;
  label?: string;
  currency?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large' | 'hero';
  style?: ViewStyle;
  icon?: string;
}

export default function AmountDisplay({
  amount,
  label,
  currency = '$',
  color = Colors.textPrimary,
  size = 'large',
  style,
  icon,
}: AmountDisplayProps) {
  const sizeStyles = {
    small: {
      amountSize: FontSize.body,
      amountWeight: FontWeight.bold,
      labelSize: FontSize.caption,
    },
    medium: {
      amountSize: FontSize.section,
      amountWeight: FontWeight.bold,
      labelSize: FontSize.body,
    },
    large: {
      amountSize: FontSize.hero - 8,
      amountWeight: FontWeight.extrabold,
      labelSize: FontSize.caption,
    },
    hero: {
      amountSize: FontSize.hero,
      amountWeight: FontWeight.extrabold,
      labelSize: FontSize.body,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View style={[styles.container, style]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text
        style={[
          styles.amount,
          {
            fontSize: currentSize.amountSize,
            fontWeight: currentSize.amountWeight,
            color,
          },
        ]}
      >
        {currency}{amount}
      </Text>
      {label && (
        <Text
          style={[
            styles.label,
            { fontSize: currentSize.labelSize },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  icon: {
    fontSize: FontSize.largeIcon,
    marginBottom: Spacing.sm,
  },
  amount: {
    color: Colors.textPrimary,
  },
  label: {
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
});
