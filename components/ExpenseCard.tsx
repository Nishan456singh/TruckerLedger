import {
    BorderRadius,
    CategoryMeta,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
    type Category
} from '@/constants/theme';
import { getShadow } from '@/constants/shadowUtils';
import type { Expense } from '@/lib/types';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

interface ExpenseCardProps {
  expense: Expense;
  onPress?: () => void;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (dateStr === today.toISOString().split('T')[0]) return 'Today';
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

export default function ExpenseCard({ expense, onPress }: ExpenseCardProps) {
  const meta = CategoryMeta[expense.category as Category] ?? CategoryMeta.other;
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Generate icon badge background with proper opacity
  const iconBadgeBackground =
    meta.color === Colors.fuel
      ? '#FF8C4233'
      : meta.color === Colors.toll
        ? '#2E7DFF33'
        : meta.color === Colors.parking
          ? '#A78BFA33'
          : meta.color === Colors.food
            ? '#00D09E33'
            : meta.color === Colors.repair
              ? '#C3224E33'
              : '#8A8A8A33';

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        style={styles.card}
      >
        {/* Left: icon badge */}
        <View style={[styles.iconBadge, { backgroundColor: iconBadgeBackground }]}>
          <Text style={styles.icon}>{meta.icon}</Text>
        </View>

        {/* Middle: category + note */}
        <View style={styles.info}>
          <Text style={styles.category}>{meta.label}</Text>
          {expense.note ? (
            <Text style={styles.note} numberOfLines={1}>
              {expense.note}
            </Text>
          ) : (
            <Text style={styles.note}>{formatDate(expense.date)}</Text>
          )}
        </View>

        {/* Right: amount + date */}
        <View style={styles.right}>
          <Text style={styles.amount}>{formatAmount(expense.amount)}</Text>
          {expense.note ? (
            <Text style={styles.date}>{formatDate(expense.date)}</Text>
          ) : null}
          {expense.receipt_uri ? (
            <Text style={styles.receiptBadge}>📎</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...getShadow(Shadow.card),
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    gap: Spacing.xs,
  },
  category: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  note: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },
  right: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
    flexShrink: 0,
  },
  amount: {
    fontSize: FontSize.subsection,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  date: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },
  receiptBadge: {
    fontSize: FontSize.small,
  },
});
