import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import HighContrastCard from './HighContrastCard';

interface InsightBadgeProps {
  label: string;
  value: string;
  icon: string;
  color?: string;
}

export default React.memo(function InsightCard({
  insight1,
  insight2,
  insight3,
  insight4,
}: {
  insight1: InsightBadgeProps;
  insight2: InsightBadgeProps;
  insight3: InsightBadgeProps;
  insight4: InsightBadgeProps;
}) {
  const badges = [insight1, insight2, insight3, insight4];

  return (
    <HighContrastCard>
      <Text style={styles.title}>📊 This Month Insights</Text>
      <View style={styles.grid}>
        {badges.map((badge, idx) => (
          <View key={idx} style={styles.badge}>
            <Text style={styles.badgeIcon}>{badge.icon}</Text>
            <Text style={styles.badgeLabel}>{badge.label}</Text>
            <Text style={[styles.badgeValue, badge.color && { color: badge.color }]}>
              {badge.value}
            </Text>
          </View>
        ))}
      </View>
    </HighContrastCard>
  );
});

const styles = StyleSheet.create({
  title: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  badge: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeLabel: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  badgeValue: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
});
