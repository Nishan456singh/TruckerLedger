import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import React, { useCallback, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export type FilterType = 'all' | 'receipts' | 'bols';

interface HistoryFilterPillsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const FILTERS: { id: FilterType; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'receipts', label: 'Receipts', icon: '🧾' },
  { id: 'bols', label: 'BOLs', icon: '📄' },
];

export default function HistoryFilterPills({
  activeFilter,
  onFilterChange,
}: HistoryFilterPillsProps) {
  const handleFilterPress = useCallback(
    (filter: FilterType) => {
      onFilterChange(filter);
    },
    [onFilterChange]
  );

  return (
    <View style={styles.container}>
      <View style={styles.pillsRow}>
        {FILTERS.map((filter) => (
          <PillButton
            key={filter.id}
            filter={filter}
            isActive={activeFilter === filter.id}
            onPress={() => handleFilterPress(filter.id)}
          />
        ))}
      </View>
    </View>
  );
}

interface PillButtonProps {
  filter: { id: FilterType; label: string; icon: string };
  isActive: boolean;
  onPress: () => void;
}

function PillButton({ filter, isActive, onPress }: PillButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonStyle = useMemo(() => {
    return [
      styles.pill,
      isActive && styles.pillActive,
      !isActive && styles.pillInactive,
    ];
  }, [isActive]);

  const textStyle = useMemo(() => {
    return [
      styles.pillText,
      isActive && styles.pillTextActive,
    ];
  }, [isActive]);

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={buttonStyle}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.95, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        activeOpacity={1}
      >
        <Text style={styles.pillIcon}>{filter.icon}</Text>
        <Text style={textStyle}>{filter.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillInactive: {
    backgroundColor: Colors.cardAlt,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  pillIcon: {
    fontSize: FontSize.body,
  },
  pillText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
  },
  pillTextActive: {
    color: Colors.textPrimary,
  },
});
