import ExpenseCard from "@/components/ExpenseCard";
import HighContrastCard from "@/components/HighContrastCard";
import InsightCard from "@/components/InsightCard";
import QuickActionButton from "@/components/QuickActionButton";
import SnapshotCard from "@/components/SnapshotCard";
import StatCard from "@/components/StatCard";
import {
    Colors,
    FontSize,
    FontWeight,
    Spacing,
} from "@/constants/theme";
import { useAuth } from "@/lib/auth/AuthContext";
import {
    getAllExpenses,
    getDashboardStats,
    getMonthlyTotal,
} from "@/lib/expenseService";
import { formatCurrency } from "@/lib/formatUtils";
import { getWeeklyTripSnapshot, getMonthlyTripSnapshot, getMonthlyInsights } from "@/lib/tripService";
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


  const firstName = user?.name?.split(" ")[0] ?? "Driver";

  const loadDashboard = useCallback(async () => {
    const now = new Date();

    const [dashboardStats, allExpenses, weeklyTripData, monthlyTripData, monthlyInsightsData, monthlyTotal] = await Promise.all([
      getDashboardStats(),
      getAllExpenses(),
      getWeeklyTripSnapshot(),
      getMonthlyTripSnapshot(),
      getMonthlyInsights(),
      getMonthlyTotal(now.getMonth() + 1, now.getFullYear()),
    ]);

    setStats(dashboardStats);
    setWeeklySnapshot(weeklyTripData);
    setMonthlySnapshot(monthlyTripData);
    setMonthlyInsights(monthlyInsightsData);
    setMonthlyExpenses(monthlyTotal);
    setRecentExpenses(allExpenses.slice(0, 6));
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
        {/* ─── Header ─────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>👋 Hello, {firstName}</Text>
            <Text style={styles.subtitle}>Keep your truck running profitable.</Text>
          </View>

          <TouchableOpacity onPress={() => router.push("/profile")} style={styles.profileBtn}>
            <Text style={styles.profileBtnText}>{firstName.slice(0, 1).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Weekly Snapshot ─────────────────────────── */}
        <SnapshotCard
          title="This Week"
          icon="📊"
          stats={[
            {
              label: "Income",
              value: formatCurrency(weeklySnapshot.income),
              icon: "💰",
              color: Colors.primary,
            },
            {
              label: "Fuel",
              value: formatCurrency(weeklySnapshot.fuel),
              icon: "⛽",
              color: Colors.fuel,
            },
            {
              label: "Other Expenses",
              value: formatCurrency(weeklySnapshot.otherExpenses),
              icon: "💸",
            },
            {
              label: "Net Profit",
              value: formatCurrency(weeklySnapshot.profit),
              icon: "📈",
              color: weeklySnapshot.profit >= 0 ? Colors.primary : Colors.danger,
            },
          ]}
        />

        {/* ─── Summary Cards ─────────────────────────── */}
        <View style={styles.summaryRow}>
          <StatCard
            value={formatCurrency(stats.todayTotal)}
            label="Today"
            color={Colors.danger}
          />
          <StatCard
            value={formatCurrency(monthlyExpenses)}
            label="This Month"
            color={Colors.textSecondary}
          />
        </View>

        {/* ─── Monthly Business ─────────────────────────── */}
        <SnapshotCard
          title="This Month"
          icon="💼"
          stats={[
            {
              label: "Income",
              value: formatCurrency(monthlySnapshot.income),
              icon: "💰",
              color: Colors.primary,
            },
            {
              label: "Fuel",
              value: formatCurrency(monthlySnapshot.fuel),
              icon: "⛽",
              color: Colors.fuel,
            },
            {
              label: "Other Expenses",
              value: formatCurrency(monthlySnapshot.otherExpenses),
              icon: "💸",
            },
            {
              label: "Net Profit",
              value: formatCurrency(monthlySnapshot.profit),
              icon: "📈",
              color: monthlySnapshot.profit >= 0 ? Colors.primary : Colors.danger,
            },
          ]}
        />

        {/* ─── Monthly Insights ─────────────────────────── */}
        {monthlyInsights.totalTripsCount > 0 && (
          <InsightCard
            insight1={{
              label: "Best Trip",
              value: formatCurrency(monthlyInsights.bestTripProfit),
              icon: "🏆",
              color: Colors.primary,
            }}
            insight2={{
              label: "Profitable",
              value: `${monthlyInsights.profitableTripsCount}/${monthlyInsights.totalTripsCount}`,
              icon: "✅",
              color: Colors.primary,
            }}
            insight3={{
              label: "Trips",
              value: monthlyInsights.totalTripsCount.toString(),
              icon: "🚚",
            }}
            insight4={{
              label: "Avg Profit",
              value: formatCurrency(monthlyInsights.averageTripProfit),
              icon: "📊",
              color: monthlyInsights.averageTripProfit >= 0 ? Colors.primary : Colors.danger,
            }}
          />
        )}

        {/* ─── Quick Actions ─────────────────────────── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <QuickActionButton
            label="Add Expense"
            icon="➕"
            onPress={() => router.push("/add-expense")}
          />
          <QuickActionButton
            label="Scan Receipt"
            icon="🧾"
            onPress={() => router.push("/scan-receipt")}
          />
        </View>

        <View style={styles.actionGrid}>
          <QuickActionButton
            label="Trip Profit"
            icon="🚚"
            onPress={() => router.push("/trip-profit")}
          />
          <QuickActionButton
            label="Scan BOL"
            icon="📄"
            onPress={() => router.push("/scan-bol" as Href)}
          />
        </View>

        <View style={styles.actionGrid}>
          <QuickActionButton
            label="Reports"
            icon="📈"
            onPress={() => router.push("/monthly-report" as Href)}
          />
          <QuickActionButton
            label="History"
            icon="📚"
            onPress={() => router.push("/expense-history")}
          />
        </View>

        {/* ─── Recent Activity ─────────────────────────── */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        {recentExpenses.length === 0 ? (
          <HighContrastCard style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySubtitle}>Start logging to see activity here.</Text>
          </HighContrastCard>
        ) : (
          <View style={styles.expensesList}>
            {recentExpenses.map((expense) => (
              <TouchableOpacity
                key={expense.id}
                onPress={() =>
                  router.push({
                    pathname: "/expense-detail",
                    params: { id: expense.id },
                  })
                }
                activeOpacity={0.85}
              >
                <ExpenseCard expense={expense} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => router.push("/expense-history")}
              activeOpacity={0.85}
            >
              <Text style={styles.historyBtnText}>📚 View Full History</Text>
            </TouchableOpacity>
          </View>
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
    gap: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  greeting: {
    color: Colors.textPrimary,
    fontSize: FontSize.section + 2,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
    marginTop: Spacing.xs,
    fontWeight: FontWeight.medium,
  },
  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  profileBtnText: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.section,
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  actionGrid: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.sm,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
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
  expensesList: {
    gap: Spacing.md,
  },
  historyBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  historyBtnText: {
    color: Colors.background,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.body,
  },
});
