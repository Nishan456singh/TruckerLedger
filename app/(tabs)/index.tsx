import ExpenseCard from '@/components/ExpenseCard';
import {
    BorderRadius,
    CategoryMeta,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
    type Category,
} from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthContext';
import { getAllExpenses, getDashboardStats } from '@/lib/expenseService';
import type { DashboardStats, Expense } from '@/lib/types';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function StatCard({
  label,
  amount,
  count,
  index,
  highlight,
}: {
  label: string;
  amount: number;
  count: number;
  index: number;
  highlight?: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 120).springify().damping(14)}
      style={[styles.statCard, highlight && styles.statCardHighlight]}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statAmount, highlight && styles.statAmountHighlight]}>
        {formatCurrency(amount)}
      </Text>
      <Text style={styles.statCount}>
        {count} {count === 1 ? 'expense' : 'expenses'}
      </Text>
    </Animated.View>
  );
}

function GreetingBanner({ firstName }: { firstName?: string }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = firstName ? `, ${firstName}` : '';

  return (
    <Animated.View entering={FadeInDown.delay(0).springify()}>
      <Text style={styles.greeting}>{greeting}{displayName} 👋</Text>
      <Text style={styles.greetingSub}>
        {new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </Text>
    </Animated.View>
  );
}

function FABButton() {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const glow = useSharedValue(1);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1800 }),
        withTiming(1, { duration: 1800 })
      ),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glow.value }],
    opacity: (glow.value - 1) * 6 + 0.5,
  }));

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  async function handlePress() {
    scale.value = withSpring(0.9, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/add-expense');
  }

  return (
    <View style={[styles.fabContainer, { bottom: Spacing.lg + insets.bottom }]}>
      <Animated.View style={[styles.fabGlow, glowStyle]} />
      <Animated.View style={fabStyle}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={1}
          style={styles.fab}
        >
          <Text style={styles.fabIcon}>+</Text>
          <Text style={styles.fabLabel}>Add Expense</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const firstName = user?.name?.split(' ')[0];

  const [stats, setStats] = useState<DashboardStats>({
    todayTotal: 0,
    weekTotal: 0,
    monthTotal: 0,
    todayCount: 0,
    weekCount: 0,
    monthCount: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadData() {
    const [statsData, expenses] = await Promise.all([
      getDashboardStats(),
      getAllExpenses(),
    ]);
    setStats(statsData);
    setRecentExpenses(expenses.slice(0, 5));
    setLoaded(true);
  }

  useEffect(() => {
    loadData().catch(console.error);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData().catch(console.error);
    }, [])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadData().catch(console.error);
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <GreetingBanner firstName={firstName} />
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push('/expense-history')}
              style={styles.historyBtn}
            >
              <Text style={styles.historyBtnText}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              style={styles.avatarBtn}
            >
              <Text style={styles.avatarInitial}>
                {firstName ? firstName[0].toUpperCase() : '👤'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Cards */}
        <Text style={styles.sectionTitle}>Summary</Text>
        <View style={styles.statsRow}>
          <StatCard
            label="Today"
            amount={stats.todayTotal}
            count={stats.todayCount}
            index={0}
            highlight
          />
          <StatCard
            label="This Week"
            amount={stats.weekTotal}
            count={stats.weekCount}
            index={1}
          />
          <StatCard
            label="This Month"
            amount={stats.monthTotal}
            count={stats.monthCount}
            index={2}
          />
        </View>

        {/* Quick Add Grid */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          <View style={styles.quickGrid}>
            {(Object.keys(CategoryMeta) as Category[]).map((cat) => {
              const meta = CategoryMeta[cat];
              return (
                <TouchableOpacity
                  key={cat}
                  style={styles.quickItem}
                  activeOpacity={0.75}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push({
                      pathname: '/add-expense',
                      params: { category: cat, mode: 'manual' },
                    });
                  }}
                >
                  <View
                    style={[
                      styles.quickIcon,
                      { backgroundColor: meta.color + '20' },
                    ]}
                  >
                    <Text style={styles.quickEmoji}>{meta.icon}</Text>
                  </View>
                  <Text style={styles.quickLabel}>{meta.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Recent Expenses */}
        {recentExpenses.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(520).springify()}
            style={styles.recentSection}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent</Text>
              <TouchableOpacity onPress={() => router.push('/expense-history')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.expenseList}>
              {recentExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onPress={() =>
                    router.push({
                      pathname: '/expense-detail',
                      params: { id: expense.id },
                    })
                  }
                />
              ))}
            </View>
          </Animated.View>
        )}

        {recentExpenses.length === 0 && loaded && (
          <Animated.View
            entering={FadeInDown.delay(500).springify()}
            style={styles.emptyState}
          >
            <Text style={styles.emptyIcon}>🚛</Text>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptyDesc}>
              Tap "+ Add Expense" to log your first expense
            </Text>
          </Animated.View>
        )}

        <View style={{ height: 80 + insets.bottom }} />
      </ScrollView>

      <FABButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  greeting: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  greetingSub: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyBtn: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md + 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyBtnText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '25',
    borderWidth: 1.5,
    borderColor: Colors.primary + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 13,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
    ...Shadow.card,
  },
  statCardHighlight: {
    borderColor: Colors.primary + '60',
    backgroundColor: Colors.primary + '15',
  },
  statLabel: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statAmount: {
    fontSize: FontSize.section - 2,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  statAmountHighlight: {
    color: Colors.primary,
  },
  statCount: {
    fontSize: FontSize.small,
    color: Colors.textMuted,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickItem: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.sm * 5) / 3,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickEmoji: {
    fontSize: 22,
  },
  quickLabel: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  recentSection: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAll: {
    fontSize: FontSize.caption,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  expenseList: {
    gap: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyIcon: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  emptyDesc: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  fabContainer: {
    position: 'absolute',
    bottom: Spacing.xxxl,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabGlow: {
    position: 'absolute',
    width: 200,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl + 4,
    borderRadius: BorderRadius.full,
    ...Shadow.button,
  },
  fabIcon: {
    fontSize: 22,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  fabLabel: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
});
