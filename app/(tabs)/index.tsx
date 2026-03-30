import ExpenseCard from "@/components/ExpenseCard";
import ScreenBackground from "@/components/ScreenBackground";
import { getShadow } from "@/constants/shadowUtils";
import {
    BorderRadius,
    Colors,
    ColorUtilities,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
} from "@/constants/theme";
import { useAuth } from "@/lib/auth/AuthContext";
import { getAllExpenses } from "@/lib/expenseService";
import { formatCurrency } from "@/lib/formatUtils";
import {
    getMonthlyTripSnapshot,
    getWeeklyTripSnapshot,
} from "@/lib/tripService";
import type { Expense } from "@/lib/types";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActionSheetIOS,
    ActivityIndicator,
    Alert,
    Platform,
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
  const [loading, setLoading] = useState(true);
  const [weekly, setWeekly] = useState({
    income: 0,
    fuel: 0,
    otherExpenses: 0,
    profit: 0,
  });
  const [monthly, setMonthly] = useState({
    income: 0,
    fuel: 0,
    otherExpenses: 0,
    profit: 0,
  });
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const name = user?.name?.split(" ")[0] ?? "Driver";

  const load = useCallback(async () => {
    try {
      const [w, m, e] = await Promise.all([
        getWeeklyTripSnapshot(),
        getMonthlyTripSnapshot(),
        getAllExpenses(),
      ]);

      setWeekly(w);
      setMonthly(m);
      setExpenses(e.slice(0, 4));
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function handleAddExpense() {
    const options = [
      {
        text: "📸 Scan Receipt",
        onPress: () => router.push("/scan-receipt"),
      },
      {
        text: "📄 Scan BOL",
        onPress: () => router.push("/scan-bol"),
      },
      {
        text: "✏️ Manual Entry",
        onPress: () => router.push("/add-expense"),
      },
      {
        text: "Cancel",
        onPress: () => {},
      },
    ];

    // Show action sheet using Alert
    const buttons = options.map((option) => ({
      text: option.text,
      onPress: option.onPress,
    }));

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: options.map((o) => o.text),
          cancelButtonIndex: options.length - 1,
          title: "How would you like to add an expense?",
        },
        (index) => {
          if (index >= 0 && index < options.length - 1) {
            options[index].onPress();
          }
        }
      );
    } else {
      // For Android, use Alert
      Alert.alert("Add Expense", "How would you like to add an expense?", buttons);
    }
  }

  if (loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
          <View style={styles.centerContainer}>
            <ActivityIndicator
              size="large"
              color={Colors.accent}
              style={{ marginBottom: Spacing.lg }}
            />
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <LinearGradient
          colors={["#C3224E", "#8E1B3B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* HEADER - Premium greeting & profile */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greetingSmall}>Good to see you</Text>
              <Text style={styles.greetingMain}>{name}</Text>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push("/profile")}
              activeOpacity={0.75}
            >
              <Text style={styles.profileInitial}>{name[0]}</Text>
            </TouchableOpacity>
          </View>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* HERO SECTION - Weekly profit display */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>Weekly Profit</Text>

            <Text style={styles.heroValue}>
              {formatCurrency(weekly.profit)}
            </Text>

            {weekly.profit > 0 ? (
              <Text style={styles.heroHint}>📈 On track this week</Text>
            ) : (
              <Text style={styles.heroHintNeutral}>Keep going strong</Text>
            )}
          </View>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* FLOATING CARD - White card with all content */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.floatingCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={Colors.accent}
                />
              }
            >
              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* QUICK ACTION BUTTONS - Premium layout */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              <View style={styles.actionsSection}>
                <View style={styles.actionGrid}>
                  {/* Add Button */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleAddExpense}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.actionIcon}>➕</Text>
                    <Text style={styles.actionLabel}>Add Expense</Text>
                    <Text style={styles.actionSubtext}>Scan or enter</Text>
                  </TouchableOpacity>

                  {/* History Button */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push("/history")}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.actionIcon}>📋</Text>
                    <Text style={styles.actionLabel}>History</Text>
                    <Text style={styles.actionSubtext}>All records</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* MONTHLY SUMMARY - Premium card design */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Monthly Summary</Text>

                <View style={styles.summaryCard}>
                  {/* Income Row */}
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryLabel}>
                      <Text style={styles.summaryIcon}>💰</Text>
                      <View>
                        <Text style={styles.summaryRowLabel}>Income</Text>
                        <Text style={styles.summaryRowHint}>
                          Total load payments
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.summaryRowValue}>
                      {formatCurrency(monthly.income)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  {/* Expenses Row */}
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryLabel}>
                      <Text style={styles.summaryIcon}>💳</Text>
                      <View>
                        <Text style={styles.summaryRowLabel}>Expenses</Text>
                        <Text style={styles.summaryRowHint}>
                          Fuel + all costs
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.summaryRowValue}>
                      {formatCurrency(monthly.fuel + monthly.otherExpenses)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  {/* Net Profit Row - Highlighted */}
                  <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
                    <View style={styles.summaryLabel}>
                      <Text style={styles.summaryIcon}>📊</Text>
                      <View>
                        <Text style={styles.summaryRowLabel}>Net Profit</Text>
                        <Text style={styles.summaryRowHint}>This month</Text>
                      </View>
                    </View>
                    <Text style={styles.summaryRowValueHighlight}>
                      {formatCurrency(
                        monthly.income - (monthly.fuel + monthly.otherExpenses)
                      )}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* RECENT EXPENSES SECTION - Premium list */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Expenses</Text>

                {expenses.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyTitle}>No expenses yet</Text>
                    <Text style={styles.emptyDesc}>
                      Add your first receipt to get started
                    </Text>
                  </View>
                ) : (
                  <View style={styles.expensesList}>
                    {expenses.map((expense, index) => (
                      <View key={expense.id}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() =>
                            router.push({
                              pathname: "/expense-detail",
                              params: { id: expense.id },
                            })
                          }
                        >
                          <ExpenseCard expense={expense} />
                        </TouchableOpacity>
                        {index < expenses.length - 1 && (
                          <View style={styles.expensesDivider} />
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },

  loadingText: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  // ─── HEADER ────────────────────────────────────────────────────────

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
  },

  greetingSmall: {
    fontSize: FontSize.caption,
    color: "rgba(255,255,255,0.7)",
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },

  greetingMain: {
    fontSize: 24,
    color: "#fff",
    fontWeight: FontWeight.extrabold,
  },

  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },

  profileInitial: {
    color: "#fff",
    fontWeight: FontWeight.bold,
    fontSize: FontSize.section,
  },

  // ─── HERO SECTION ──────────────────────────────────────────────────

  heroContent: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },

  heroLabel: {
    fontSize: FontSize.body,
    color: "rgba(255,255,255,0.75)",
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.sm,
  },

  heroValue: {
    fontSize: 44,
    color: "#fff",
    fontWeight: FontWeight.extrabold,
    marginBottom: Spacing.md,
  },

  heroHint: {
    fontSize: FontSize.caption,
    color: "#22C55E",
    fontWeight: FontWeight.semibold,
  },

  heroHintNeutral: {
    fontSize: FontSize.caption,
    color: "rgba(255,255,255,0.6)",
    fontWeight: FontWeight.medium,
  },

  // ─── FLOATING CARD ────────────────────────────────────────────────

  floatingCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    marginTop: Spacing.xl,
    overflow: "hidden",
    ...getShadow(Shadow.large),
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
  },

  // ─── ACTIONS SECTION ────────────────────────────────────────────

  actionsSection: {
    marginBottom: Spacing.xl,
  },

  actionGrid: {
    flexDirection: "row",
    gap: Spacing.lg,
  },

  actionButton: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    ...getShadow(Shadow.card),
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },

  actionIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },

  actionLabel: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "center",
  },

  actionSubtext: {
    fontSize: FontSize.small,
    color: Colors.textMuted,
    textAlign: "center",
  },

  // ─── SECTIONS ──────────────────────────────────────────────────

  section: {
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.subsection,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // ─── MONTHLY SUMMARY ────────────────────────────────────────────

  summaryCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...getShadow(Shadow.small),
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },

  summaryLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },

  summaryIcon: {
    fontSize: 24,
  },

  summaryRowLabel: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },

  summaryRowHint: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  summaryRowValue: {
    fontSize: FontSize.subsection,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: "right",
  },

  summaryRowHighlight: {
    paddingHorizontal: Spacing.md,
    marginHorizontal: -Spacing.md,
    marginVertical: Spacing.xs,
    paddingVertical: Spacing.lg,
    backgroundColor: ColorUtilities.accentLight10,
    borderRadius: BorderRadius.md,
  },

  summaryRowValueHighlight: {
    fontSize: FontSize.subsection,
    fontWeight: FontWeight.extrabold,
    color: Colors.accent,
    textAlign: "right",
  },

  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },

  // ─── EXPENSES LIST ─────────────────────────────────────────────

  expensesList: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.card,
    ...getShadow(Shadow.card),
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },

  expensesDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },

  // ─── EMPTY STATE ────────────────────────────────────────────────

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },

  emptyTitle: {
    fontSize: FontSize.subsection,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  emptyDesc: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
  },
});
