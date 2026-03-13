import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Spacing
} from "@/constants/theme";

import { useAuth } from "@/lib/auth/AuthContext";

import {
    getAllExpenses,
    getCategoryStats,
    getDashboardStats,
    type CategoryStat,
} from "@/lib/expenseService";

import type { DashboardStats, Expense } from "@/lib/types";

import * as Haptics from "expo-haptics";

import { router, useFocusEffect } from "expo-router";

import React, { useCallback, useEffect, useState } from "react";

import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

function getCategoryTotal(stats: CategoryStat[], key: string): number {
  const row = stats.find((item) => item.category === key);
  return row?.total ?? 0;
}

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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
      entering={FadeInDown.delay(index * 120).springify()}
      style={[
        styles.statCard,
        highlight && styles.statCardHighlight,
      ]}
    >
      <Text style={styles.statLabel}>{label}</Text>

      <Text
        style={[
          styles.statAmount,
          highlight && styles.statAmountHighlight,
        ]}
      >
        {formatCurrency(amount)}
      </Text>

      <Text style={styles.statCount}>
        {count} {count === 1 ? "expense" : "expenses"}
      </Text>
    </Animated.View>
  );
}

function GreetingBanner({ firstName }: { firstName?: string }) {
  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
      ? "Good afternoon"
      : "Good evening";

  const displayName = firstName ? `, ${firstName}` : "";

  return (
    <Animated.View entering={FadeInDown.springify()}>
      <Text style={styles.greeting}>
        {greeting}
        {displayName} 👋
      </Text>

      <Text style={styles.greetingSub}>
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
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
      -1
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
    scale.value = withSpring(0.9, {}, () => {
      scale.value = withSpring(1);
    });

    await Haptics.impactAsync(
      Haptics.ImpactFeedbackStyle.Heavy
    );

    router.push("/add-expense");
  }

  return (
    <View
      style={[
        styles.fabContainer,
        { bottom: Spacing.lg + insets.bottom },
      ]}
    >
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

  const firstName = user?.name?.split(" ")[0];

  const [stats, setStats] = useState<DashboardStats>({
    todayTotal: 0,
    weekTotal: 0,
    monthTotal: 0,
    todayCount: 0,
    weekCount: 0,
    monthCount: 0,
  });

  const [recentExpenses, setRecentExpenses] = useState<
    Expense[]
  >([]);

  const [categoryStats, setCategoryStats] = useState<
    CategoryStat[]
  >([]);

  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadData() {
    const [statsData, expenses, catStats] =
      await Promise.all([
        getDashboardStats(),
        getAllExpenses(),
        getCategoryStats(),
      ]);

    setStats(statsData);
    setRecentExpenses(expenses.slice(0, 5));
    setCategoryStats(catStats);
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
    <SafeAreaView style={styles.safe} edges={["top"]}>
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
        <View style={styles.header}>
          <GreetingBanner firstName={firstName} />

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() =>
                router.push("/expense-history")
              }
              style={styles.historyBtn}
            >
              <Text style={styles.historyBtnText}>
                History
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/profile")}
              style={styles.avatarBtn}
            >
              <Text style={styles.avatarInitial}>
                {firstName
                  ? firstName[0].toUpperCase()
                  : "👤"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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

        <View style={styles.monthSummaryCard}>
          <Text style={styles.monthSummaryTitle}>Monthly Summary</Text>

          <View style={styles.monthSummaryRow}>
            <Text style={styles.monthSummaryLabel}>This Month</Text>
            <Text style={styles.monthSummaryValue}>
              {formatCurrency(stats.monthTotal)}
            </Text>
          </View>

          <View style={styles.monthSummaryRow}>
            <Text style={styles.monthSummaryLabel}>Fuel</Text>
            <Text style={styles.monthSummarySubValue}>
              {formatCurrency(getCategoryTotal(categoryStats, "fuel"))}
            </Text>
          </View>

          <View style={styles.monthSummaryRow}>
            <Text style={styles.monthSummaryLabel}>Food</Text>
            <Text style={styles.monthSummarySubValue}>
              {formatCurrency(getCategoryTotal(categoryStats, "food"))}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/monthly-report")}
            activeOpacity={0.85}
            style={styles.reportBtn}
          >
            <Text style={styles.reportBtnText}>View Monthly Report</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toolsRow}>
          <TouchableOpacity
            onPress={() => router.push("/trip-profit")}
            style={styles.toolBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.toolBtnIcon}>🧮</Text>
            <Text style={styles.toolBtnText}>Trip Profit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/receipts")}
            style={styles.toolBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.toolBtnIcon}>🧾</Text>
            <Text style={styles.toolBtnText}>Receipts</Text>
          </TouchableOpacity>
        </View>

        {recentExpenses.length === 0 && loaded && (
          <Animated.View
            entering={FadeInDown.delay(500).springify()}
            style={styles.emptyState}
          >
            <Text style={styles.emptyIcon}>🚛</Text>
            <Text style={styles.emptyTitle}>
              No expenses yet
            </Text>
            <Text style={styles.emptyDesc}>
              Tap &quot;+ Add Expense&quot; to log your first
              expense
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },

  greeting: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  greetingSub: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },

  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  monthSummaryCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },

  monthSummaryTitle: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },

  monthSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },

  monthSummaryLabel: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },

  monthSummaryValue: {
    fontSize: FontSize.section,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
  },

  monthSummarySubValue: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },

  reportBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm + 2,
  },

  reportBtnText: {
    fontSize: FontSize.caption,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },

  toolsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },

  toolBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },

  toolBtnIcon: {
    fontSize: 14,
  },

  toolBtnText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },

  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  statCardHighlight: {
    borderColor: Colors.primary,
  },

  statLabel: {
    fontSize: FontSize.small,
    color: Colors.textMuted,
  },

  statAmount: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  statAmountHighlight: {
    color: Colors.primary,
  },

  statCount: {
    fontSize: FontSize.small,
    color: Colors.textMuted,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
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
    textAlign: "center",
  },

  fabContainer: {
    position: "absolute",
    alignSelf: "center",
  },

  fabGlow: {
    position: "absolute",
    width: 200,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },

  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },

  fabIcon: {
    fontSize: 22,
    color: "#fff",
  },

  fabLabel: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: "#fff",
  },
  avatarBtn: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: Colors.primary + "25",
  borderWidth: 1.5,
  borderColor: Colors.primary + "60",
  alignItems: "center",
  justifyContent: "center",
},

avatarInitial: {
  fontSize: 14,
  fontWeight: FontWeight.bold,
  color: Colors.primary,
},

sectionTitle: {
  fontSize: FontSize.caption,
  fontWeight: FontWeight.semibold,
  color: Colors.textMuted,
  textTransform: "uppercase",
  letterSpacing: 1.2,
  marginBottom: Spacing.md,
  marginTop: Spacing.sm,
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
});