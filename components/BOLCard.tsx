import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
} from '@/constants/theme';
import type { BOLRecord } from '@/lib/types';
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

interface BOLCardProps {
  bol: BOLRecord;
  onPress?: () => void;
}

function formatAmount(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '-';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
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

export default function BOLCard({ bol, onPress }: BOLCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Extract pickup city/state and delivery city/state
  const pickupLocation = bol.pickup_location || 'Unknown';
  const deliveryLocation = bol.delivery_location || 'Unknown';

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
        <View style={[styles.iconBadge, { backgroundColor: '#E5F4FF' }]}>
          <Text style={styles.icon}>📄</Text>
        </View>

        {/* Middle: broker + route info */}
        <View style={styles.info}>
          <Text style={styles.broker}>{bol.broker || 'No Broker'}</Text>
          <View style={styles.route}>
            <Text style={styles.location} numberOfLines={1}>
              {pickupLocation}
            </Text>
            <Text style={styles.arrow}>→</Text>
            <Text style={styles.location} numberOfLines={1}>
              {deliveryLocation}
            </Text>
          </View>
        </View>

        {/* Right: amount + date */}
        <View style={styles.right}>
          <Text style={styles.amount}>{formatAmount(bol.load_amount)}</Text>
          <Text style={styles.date}>{formatDate(bol.date)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    ...Shadow.card,
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
    fontSize: 22,
  },
  info: {
    flex: 1,
    gap: Spacing.sm,
  },
  broker: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  location: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    flex: 1,
  },
  arrow: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    marginHorizontal: Spacing.xs,
  },
  right: {
    alignItems: 'flex-end',
    gap: 3,
    flexShrink: 0,
  },
  amount: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  date: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },
});
