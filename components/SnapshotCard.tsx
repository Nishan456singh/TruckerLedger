import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import HighContrastCard from './HighContrastCard';

interface SnapshotStatProps {
  label: string;
  value: string;
  icon?: string;
  color?: string;
}

interface SnapshotCardProps {
  title: string;
  stats: SnapshotStatProps[];
  icon?: string;
}

function SnapshotCard({
  title,
  stats,
  icon,
}: SnapshotCardProps) {
  return (
    <HighContrastCard>
      {/* Header */}
      <View style={styles.header}>
        {icon && <Text style={styles.headerIcon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <StatRow key={stat.label} stat={stat} />
        ))}
      </View>
    </HighContrastCard>
  );
}

interface StatRowProps {
  stat: SnapshotStatProps;
}

const StatRow = React.memo(function StatRow({ stat }: StatRowProps) {
  const statValueStyle = useMemo(
    () => [
      styles.statValue,
      stat.color ? { color: stat.color } : null,
    ],
    [stat.color]
  );

  return (
    <View style={styles.statRow}>
      {stat.icon && <Text style={styles.statIcon}>{stat.icon}</Text>}
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{stat.label}</Text>
        <Text style={statValueStyle}>{stat.value}</Text>
      </View>
    </View>
  );
});

export default React.memo(SnapshotCard);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIcon: {
    fontSize: FontSize.headerIcon,
  },
  title: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  statsGrid: {
    gap: Spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  statIcon: {
    fontSize: FontSize.statIcon,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
});
