import HighContrastCard from "@/components/HighContrastCard";
import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
} from "@/constants/theme";
import { getBusinessInsights, type AiInsightResult } from "@/lib/ai/insightsAI";
import { useAuth } from "@/lib/auth/AuthContext";
import {
    getAllExpenses,
    getDashboardStats,
    getMonthlyTotal,
} from "@/lib/expenseService";
import { getWeeklyTripSnapshot } from "@/lib/tripService";
import type { DashboardStats, Expense } from "@/lib/types";
import { router, useFocusEffect, type Href } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function QuickAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    todayTotal: 0,
    weekTotal: 0,
    monthTotal: 0,
    todayCount: 0,
    weekCount: 0,
    monthCount: 0,
  });
  const [weeklySnapshot, setWeeklySnapshot] = useState({
    income: 0,
    fuel: 0,
    otherExpenses: 0,
    profit: 0,
  });
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [aiInsight, setAiInsight] = useState<AiInsightResult | null>(null);

  const firstName = user?.name?.split(" ")[0] ?? "Driver";

  const loadDashboard = useCallback(async () => {
    const now = new Date();

    const [dashboardStats, allExpenses, weeklyTripData, monthlyTotal] = await Promise.all([
      getDashboardStats(),
      getAllExpenses(),
      getWeeklyTripSnapshot(),
      getMonthlyTotal(now.getMonth() + 1, now.getFullYear()),
    ]);

    setStats(dashboardStats);
    setWeeklySnapshot(weeklyTripData);
    setMonthlyExpenses(monthlyTotal);
    setRecentExpenses(allExpenses.slice(0, 6));

    const insight = await getBusinessInsights({
      todayTotal: dashboardStats.todayTotal,
      weekTotal: dashboardStats.weekTotal,
      monthTotal: dashboardStats.monthTotal,
      weekCount: dashboardStats.weekCount,
      monthCount: dashboardStats.monthCount,
      weeklyIncome: weeklyTripData.income,
      weeklyFuel: weeklyTripData.fuel,
      weeklyOtherExpenses: weeklyTripData.otherExpenses,
      weeklyProfit: weeklyTripData.profit,
    });

    setAiInsight(insight);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard().catch(console.error);
    }, [loadDashboard])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboard().catch(console.error);
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName}</Text>
            <Text style={styles.subtitle}>Keep your truck business on track.</Text>
          </View>

          <TouchableOpacity onPress={() => router.push("/profile")} style={styles.profileBtn}>
            <Text style={styles.profileBtnText}>{firstName.slice(0, 1).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <HighContrastCard style={styles.summaryCard}>
            <Text style={styles.cardLabel}>Today Expenses</Text>
            <Text style={styles.cardValue}>{formatCurrency(stats.todayTotal)}</Text>
          </HighContrastCard>

          <HighContrastCard style={styles.summaryCard}>
            <Text style={styles.cardLabel}>Monthly Expenses</Text>
            <Text style={styles.cardValue}>{formatCurrency(monthlyExpenses)}</Text>
          </HighContrastCard>
        </View>

        <HighContrastCard style={styles.snapshotCard}>
          <Text style={styles.snapshotTitle}>Weekly Snapshot</Text>

          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>Income</Text>
            <Text style={styles.snapshotValue}>{formatCurrency(weeklySnapshot.income)}</Text>
          </View>

          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>Fuel Cost</Text>
            <Text style={styles.snapshotValue}>{formatCurrency(weeklySnapshot.fuel)}</Text>
          </View>

          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotLabel}>Other Expenses</Text>
            <Text style={styles.snapshotValue}>{formatCurrency(weeklySnapshot.otherExpenses)}</Text>
          </View>

          <View style={styles.snapshotDivider} />

          <View style={styles.snapshotRow}>
            <Text style={styles.snapshotProfitLabel}>Profit</Text>
            <Text
              style={[
                styles.snapshotProfitValue,
                { color: weeklySnapshot.profit >= 0 ? Colors.accent : Colors.danger },
              ]}
            >
              {formatCurrency(weeklySnapshot.profit)}
            </Text>
          </View>
        </HighContrastCard>

        {aiInsight ? (
          <HighContrastCard style={styles.aiCard}>
            <Text style={styles.aiTitle}>{aiInsight.headline}</Text>
            <Text style={styles.aiSummary}>{aiInsight.summary}</Text>
            {aiInsight.actions.map((action, index) => (
              <Text key={`${index}-${action}`} style={styles.aiAction}>
                {`• ${action}`}
              </Text>
            ))}
          </HighContrastCard>
        ) : null}

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <QuickAction label="Add Expense" icon="➕" onPress={() => router.push("/add-expense")} />
          <QuickAction label="Scan Receipt" icon="🧾" onPress={() => router.push("/scan-receipt")} />
        </View>

        <View style={styles.quickActionsRow}>
          <QuickAction
            label="Scan BOL"
            icon="📄"
            onPress={() => router.push("/scan-bol" as Href)}
          />
          <QuickAction label="Trip Profit" icon="🧮" onPress={() => router.push("/trip-profit")} />
        </View>

        <View style={styles.quickActionsRow}>
          <QuickAction label="Fuel Stats" icon="⛽" onPress={() => router.push("/fuel-stats" as Href)} />
          <QuickAction label="BOL History" icon="📚" onPress={() => router.push("/bol-history" as Href)} />
        </View>

        <Text style={styles.sectionTitle}>Recent Expenses</Text>

        {recentExpenses.length === 0 ? (
          <HighContrastCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySubtitle}>Tap Add Expense to log your first record.</Text>
          </HighContrastCard>
        ) : (
          <HighContrastCard style={styles.listCard}>
            {recentExpenses.map((expense) => (
              <TouchableOpacity
                key={expense.id}
                onPress={() =>
                  router.push({
                    pathname: "/expense-detail",
                    params: { id: expense.id },
                  })
                }
                style={styles.listRow}
                activeOpacity={0.85}
              >
                <View>
                  <Text style={styles.listAmount}>{formatCurrency(expense.amount)}</Text>
                  <Text style={styles.listMeta}>
                    {expense.category.toUpperCase()} • {expense.date}
                  </Text>
                </View>

                <Text style={styles.listChevron}>›</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => router.push("/expense-history")}
              activeOpacity={0.85}
            >
              <Text style={styles.historyBtnText}>View Full History</Text>
            </TouchableOpacity>
          </HighContrastCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
    marginTop: 2,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  profileBtnText: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
  },
  cardLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
    marginBottom: Spacing.xs,
  },
  cardValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
  },
  snapshotCard: {
  },
  aiCard: {
    gap: Spacing.xs,
  },
  aiTitle: {
    color: Colors.accent,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  aiSummary: {
    color: Colors.textPrimary,
    fontSize: FontSize.caption + 1,
    marginBottom: 2,
  },
  aiAction: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
  },
  snapshotTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  snapshotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  snapshotLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
  },
  snapshotValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
  },
  snapshotDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  snapshotProfitLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
  snapshotProfitValue: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.extrabold,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.sm,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  quickAction: {
    flex: 1,
    minHeight: 74,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    ...Shadow.card,
  },
  quickActionIcon: {
    fontSize: 18,
  },
  quickActionLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.caption + 1,
    fontWeight: FontWeight.semibold,
  },
  emptyCard: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
  },
  listCard: {
    paddingHorizontal: Spacing.lg,
  },
  listRow: {
    minHeight: 64,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listAmount: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
  listMeta: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
    marginTop: 2,
  },
  listChevron: {
    color: Colors.textMuted,
    fontSize: 24,
  },
  historyBtn: {
    marginVertical: Spacing.md,
    minHeight: 54,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  historyBtnText: {
    color: Colors.background,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.caption,
  },
});
