import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import HighContrastCard from './HighContrastCard';

interface StatCardProps {
  value: string; // Formatted value (e.g., "$2,500")
  label: string; // Label (e.g., "Income")
  icon?: string; // Optional emoji icon
  color?: string; // Optional color accent (uses textPrimary by default)
}

function StatCard({
  value,
  label,
  icon,
  color = Colors.textPrimary,
}: StatCardProps) {
  const valueStyle = useMemo(
    () => [styles.value, color ? { color } : null],
    [color]
  );

  return (
    <HighContrastCard style={styles.card}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={valueStyle}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </HighContrastCard>
  );
}

export default React.memo(StatCard);

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  icon: {
    fontSize: FontSize.largeIcon,
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  label: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    letterSpacing: 0.5,
  },
});
