import AddActionModal from "@/components/AddActionModal";
import ExpenseCard from "@/components/ExpenseCard";
import ScreenBackground from "@/components/ScreenBackground";
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
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
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
  const [addModalVisible, setAddModalVisible] = useState(false);
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

  const profitColor = weeklySnapshot.profit >= 0 ? Colors.primary : Colors.danger;
  const profitEmoji = weeklySnapshot.profit >= 0 ? "📈" : "📉";

  const handleAddReceipt = useCallback(() => {
    router.push("/scan-receipt");
  }, []);

  const handleAddBOL = useCallback(() => {
    router.push("/scan-bol");
  }, []);

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        {/* Add Action Modal */}
        <AddActionModal
          visible={addModalVisible}
          onClose={() => setAddModalVisible(false)}
          onAddReceipt={handleAddReceipt}
          onAddBOL={handleAddBOL}
        />

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* REFERENCE DESIGN ARCHITECTURE: 50/50 LAYOUT                    */}
        {/* Hero background (50%) + Floating white card (50%) overlapping  */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        <View style={styles.container}>
          {/* ─── HERO SECTION (50% of screen) ─────────────────────────── */}
          <LinearGradient
            colors={[Colors.secondary, '#5A8FB5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroSection}
          >
            {/* Top Header Bar */}
            <View style={styles.heroHeader}>
              <View>
                <Text style={styles.heroGreeting}>Welcome, {firstName}!</Text>
                <Text style={styles.heroSubtitle}>Your business at a glance</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/profile")}
                style={styles.heroProfileBtn}
              >
                <Text style={styles.heroProfileText}>{firstName.slice(0, 1).toUpperCase()}</Text>
              </TouchableOpacity>
            </View>

            {/* Centered Hero Metric */}
            <View style={styles.heroMetricCenter}>
              <Text style={styles.heroMetricLabel}>This Week's Profit</Text>
              <Text style={[styles.heroMetricValue, { color: profitColor }]}>
                {formatCurrency(weeklySnapshot.profit)}
              </Text>
              <Text style={styles.heroMetricEmoji}>{profitEmoji}</Text>
            </View>

            {/* Metric Pills (floating elements) */}
            <View style={styles.heroMetricPills}>
              <View style={styles.metricPill}>
                <Text style={styles.metricPillLabel}>Income</Text>
                <Text style={styles.metricPillValue}>
                  {formatCurrency(weeklySnapshot.income)}
                </Text>
              </View>
              <View style={styles.metricPill}>
                <Text style={styles.metricPillLabel}>Expenses</Text>
                <Text style={styles.metricPillValue}>
                  {formatCurrency(weeklySnapshot.fuel + weeklySnapshot.otherExpenses)}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* ─── FLOATING BOTTOM CARD (overlaps hero, contains content) ─────────── */}
          <View style={styles.floatingCardContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.cardContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={Colors.primary}
                />
              }
            >
              {/* Quick Actions */}
              <View>
                <Text style={styles.cardSectionTitle}>Quick Actions</Text>
                <View style={styles.actionGrid}>
                  <TouchableOpacity
                    style={styles.actionTile}
                    onPress={() => setAddModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.actionIcon}>➕</Text>
                    <Text style={styles.actionLabel}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionTile}
                    onPress={() => router.push("/history")}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.actionIcon}>📋</Text>
                    <Text style={styles.actionLabel}>History</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionTile}
                    onPress={() => router.push("/trip-profit")}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.actionIcon}>🚚</Text>
                    <Text style={styles.actionLabel}>Trips</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Monthly Overview */}
              <View style={styles.cardSection}>
                <Text style={styles.cardSectionTitle}>This Month</Text>
                <View style={styles.monthlyGrid}>
                  <View style={styles.monthlyCard}>
                    <Text style={styles.monthlyLabel}>Income</Text>
                    <Text style={[styles.monthlyValue, { color: Colors.primary }]}>
                      {formatCurrency(monthlySnapshot.income)}
                    </Text>
                  </View>
                  <View style={styles.monthlyCard}>
                    <Text style={styles.monthlyLabel}>Total Exp</Text>
                    <Text style={[styles.monthlyValue, { color: Colors.accent }]}>
                      {formatCurrency(monthlySnapshot.fuel + monthlySnapshot.otherExpenses)}
                    </Text>
                  </View>
                  <View style={styles.monthlyCard}>
                    <Text style={styles.monthlyLabel}>Profit</Text>
                    <Text style={[styles.monthlyValue, { color: monthlySnapshot.profit >= 0 ? Colors.primary : Colors.danger }]}>
                      {formatCurrency(monthlySnapshot.profit)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Recent Activity */}
              <View style={styles.cardSection}>
                <Text style={styles.cardSectionTitle}>Recent Activity</Text>
                {recentExpenses.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyTitle}>No expenses yet</Text>
                    <Text style={styles.emptySubtitle}>Add your first expense to get started</Text>
                  </View>
                ) : (
                  <View style={styles.expenseList}>
                    {recentExpenses.map((expense) => (
                      <TouchableOpacity
                        key={expense.id}
                        style={styles.expenseItem}
                        onPress={() =>
                          router.push({
                            pathname: "/expense-detail",
                            params: { id: expense.id },
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <ExpenseCard expense={expense} />
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      style={styles.viewAllBtn}
                      onPress={() => router.push("/history")}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.viewAllBtnText}>View All History →</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // ═══════════════════════════════════════════════════════════════
  // MAIN LAYOUT: Container with Hero + Floating Card
  // ═══════════════════════════════════════════════════════════════

  container: {
    flex: 1,
    position: "relative",
  },

  // ─── HERO SECTION ───────────────────────────────────────────

  heroSection: {
    flex: 0.5,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.md,
    justifyContent: "space-between",
  },

  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  heroGreeting: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
  },

  heroSubtitle: {
    fontSize: FontSize.body,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: FontWeight.medium,
  },

  heroProfileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroProfileText: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  heroMetricCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },

  heroMetricLabel: {
    fontSize: FontSize.body,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: FontWeight.medium,
  },

  heroMetricValue: {
    fontSize: FontSize.hero + 4,
    fontWeight: FontWeight.extrabold,
  },

  heroMetricEmoji: {
    fontSize: FontSize.largeIcon,
    marginTop: Spacing.xs,
  },

  heroMetricPills: {
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "center",
  },

  metricPill: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    minWidth: 100,
  },

  metricPillLabel: {
    fontSize: FontSize.caption,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },

  metricPillValue: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  // ─── FLOATING CARD ──────────────────────────────────────────

  floatingCardContainer: {
    flex: 0.55,
    marginTop: -Spacing.lg,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: 32,
    overflow: "hidden",
    ...{
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 10,
    },
  },

  cardContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.xl,
  },

  cardSectionTitle: {
    fontSize: FontSize.subsection,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  cardSection: {
    gap: Spacing.md,
  },

  // ─── ACTION GRID ────────────────────────────────────────────

  actionGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  actionTile: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  actionIcon: {
    fontSize: 28,
  },

  actionLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: "center",
  },

  // ─── MONTHLY GRID ───────────────────────────────────────────

  monthlyGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },

  monthlyCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },

  monthlyLabel: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },

  monthlyValue: {
    fontSize: FontSize.section + 1,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },

  // ─── EXPENSE LIST ───────────────────────────────────────────

  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },

  emptyTitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  emptySubtitle: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    textAlign: "center",
  },

  expenseList: {
    gap: Spacing.md,
  },

  expenseItem: {
    marginBottom: 0,
  },

  viewAllBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  viewAllBtnText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
});
