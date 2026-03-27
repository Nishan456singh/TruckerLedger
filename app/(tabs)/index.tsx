import ExpenseCard from "@/components/ExpenseCard";
import HighContrastCard from "@/components/HighContrastCard";
import QuickActionButton from "@/components/QuickActionButton";
import SnapshotCard from "@/components/SnapshotCard";
import {
    Colors,
    FontSize,
    FontWeight,
    Spacing,
} from "@/constants/theme";
import { useAuth } from "@/lib/auth/AuthContext";
import {
    getAllExpenses,
    getMonthlyTotal
} from "@/lib/expenseService";
import { formatCurrency } from "@/lib/formatUtils";
import { getMonthlyTripSnapshot, getWeeklyTripSnapshot } from "@/lib/tripService";
import type { Expense } from "@/lib/types";
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

export default function DashboardScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [weeklySnapshot, setWeeklySnapshot] = useState({
    income: 0,
    fuel: 0,
    otherExpenses: 0,
    profit: 0,
  });
  const [monthlySnapshot, setMonthlySnapshot] = useState({
    income: 0,
    fuel: 0,
    otherExpenses: 0,
    profit: 0,
    tripCount: 0,
  });
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);

  const firstName = user?.name?.split(" ")[0] ?? "Driver";

  const loadDashboard = useCallback(async () => {
    const now = new Date();

    const [weeklyTripData, monthlyTripData, allExpenses, monthlyTotal] = await Promise.all([
      getWeeklyTripSnapshot(),
      getMonthlyTripSnapshot(),
      getAllExpenses(),
      getMonthlyTotal(now.getMonth() + 1, now.getFullYear()),
    ]);

    setWeeklySnapshot(weeklyTripData);
    setMonthlySnapshot(monthlyTripData);
    setRecentExpenses(allExpenses.slice(0, 4));
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
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>👋 {firstName}</Text>
            <Text style={styles.subtitle}>Track your trips & earnings</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/profile")} style={styles.profileBtn}>
            <Text style={styles.profileBtnText}>{firstName.slice(0, 1).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Quick Actions ─────────────────────────── */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <QuickActionButton
            label="Add Expense"
            icon="➕"
            variant="primary"
            onPress={() => router.push("/add-expense")}
          />
          <QuickActionButton
            label="Scan Receipt"
            icon="🧾"
            variant="secondary"
            onPress={() => router.push("/scan-receipt")}
          />
          <QuickActionButton
            label="Trip Profit"
            icon="🚚"
            variant="fuel"
            onPress={() => router.push("/trip-profit")}
          />
        </View>

        <View style={styles.actionGrid}>
          <QuickActionButton
            label="Analytics"
            icon="📊"
            variant="accent"
            onPress={() => router.push("/analytics")}
          />
          <QuickActionButton
            label="Reports"
            icon="📈"
            variant="food"
            onPress={() => router.push("/monthly-report" as Href)}
          />
          <QuickActionButton
            label="Settings"
            icon="⚙️"
            variant="default"
            onPress={() => router.push("/cloud-settings")}
          />
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
              label: "Expenses",
              value: formatCurrency(weeklySnapshot.otherExpenses),
              icon: "💸",
            },
            {
              label: "Profit",
              value: formatCurrency(weeklySnapshot.profit),
              icon: "📈",
              color: weeklySnapshot.profit >= 0 ? Colors.primary : Colors.danger,
            },
          ]}
        />

        {/* ─── Monthly Snapshot ─────────────────────────── */}
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
              label: "Expenses",
              value: formatCurrency(monthlySnapshot.otherExpenses),
              icon: "💸",
            },
            {
              label: "Profit",
              value: formatCurrency(monthlySnapshot.profit),
              icon: "📈",
              color: monthlySnapshot.profit >= 0 ? Colors.primary : Colors.danger,
            },
          ]}
        />

        {/* ─── Recent Activity ─────────────────────────── */}
        <Text style={styles.sectionTitle}>Recent</Text>

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
              <Text style={styles.historyBtnText}>📚 View All</Text>
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
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(34, 197, 94, 0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(34, 197, 94, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileBtnText: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.section,
  },
  actionGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.body + 2,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderWidth: 1.5,
    borderColor: "rgba(0, 0, 0, 0.06)",
    borderRadius: 16,
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
    gap: Spacing.sm,
  },
  historyBtn: {
    marginTop: Spacing.sm,
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
