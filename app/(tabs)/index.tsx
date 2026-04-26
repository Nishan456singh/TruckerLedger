import ExpenseCard from "@/components/ExpenseCard";
import ScreenBackground from "@/components/ScreenBackground";
import {
    BorderRadius,
    Spacing,
} from "@/constants/theme";

import { useAuth } from "@/lib/auth/AuthContext";
import { getAllExpenses, getMonthlyProfit } from "@/lib/expenseService";
import { formatCurrency } from "@/lib/formatUtils";
import {
    getWeeklyTripSnapshot,
} from "@/lib/tripService";

import type { MonthlyProfit } from "@/lib/expenseService";
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

import Animated, { FadeInDown } from "react-native-reanimated";
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

  const [monthly, setMonthly] = useState<MonthlyProfit>({
    bolIncome: 0,
    expenses: 0,
    profit: 0,
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);

  const name = user?.name?.split(" ")[0] ?? "Driver";

  const load = useCallback(async () => {
    try {
      const [w, m, e] = await Promise.all([
        getWeeklyTripSnapshot(),
        getMonthlyProfit(),
        getAllExpenses(),
      ]);

      setWeekly(w);
      setMonthly(m);
      setExpenses(e.slice(0, 4));
    } catch (err) {
      console.error(err);
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
      { text: "Cancel", onPress: () => {} },
    ];

    const buttons = options.map((option) => ({
      text: option.text,
      onPress: option.onPress,
    }));

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: options.map((o) => o.text),
          cancelButtonIndex: options.length - 1,
        },
        (index) => {
          if (index >= 0 && index < options.length - 1) {
            options[index].onPress();
          }
        }
      );
    } else {
      Alert.alert("Add Expense", "Choose method", buttons);
    }
  }

  if (loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <LinearGradient
        colors={["#05060A", "#0E1016", "#181A21"]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safe}>
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greetingSmall}>Welcome back</Text>
              <Text style={styles.greetingMain}>{name}</Text>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push("/profile")}
            >
              <Text style={styles.profileInitial}>{name[0]}</Text>
            </TouchableOpacity>
          </View>

          {/* HERO PROFIT */}
          <Animated.View entering={FadeInDown.delay(120)} style={styles.hero}>
            <Text style={styles.heroLabel}>Weekly Profit</Text>

            <Text style={styles.heroValue}>
              {formatCurrency(weekly.profit)}
            </Text>

            <Text style={styles.heroHint}>
              {weekly.profit > 0
                ? "📈 You're profitable this week"
                : "Keep pushing — next load matters"}
            </Text>
          </Animated.View>

          {/* MAIN CONTENT */}
          <View style={styles.card}>
            <ScrollView
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* ACTION BUTTONS */}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleAddExpense}
                >
                  <Text style={styles.actionIcon}>➕</Text>
                  <Text style={styles.actionLabel}>Add Expense</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push("/history")}
                >
                  <Text style={styles.actionIcon}>📋</Text>
                  <Text style={styles.actionLabel}>History</Text>
                </TouchableOpacity>
              </View>

              {/* MONTHLY SUMMARY */}

              <Text style={styles.sectionTitle}>Monthly Summary</Text>

              <View style={styles.summaryCard}>
                <Row
                  label="BOL Income"
                  value={formatCurrency(monthly.bolIncome)}
                  color="#3EE58A"
                />

                <Divider />

                <Row
                  label="Expenses"
                  value={formatCurrency(monthly.expenses)}
                  color="#FF5A5A"
                />

                <Divider />

                <Row
                  label="Net Profit"
                  value={formatCurrency(monthly.profit)}
                  color={monthly.profit >= 0 ? "#3EE58A" : "#FF5A5A"}
                  bold
                />
              </View>

              {/* RECENT EXPENSES */}

              <Text style={styles.sectionTitle}>Recent Expenses</Text>

              {expenses.length === 0 ? (
                <Text style={styles.emptyText}>
                  No expenses recorded yet.
                </Text>
              ) : (
                <View style={styles.expenseList}>
                  {expenses.map((expense) => (
                    <ExpenseCard key={expense.id} expense={expense} />
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ScreenBackground>
  );
}

function Row({ label, value, color, bold }: any) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowLabelBold]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: color || "#fff" }, bold && styles.rowValueBold]}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  container: { flex: 1 },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loadingText: {
    color: "#fff",
    fontSize: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  greetingSmall: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },

  greetingMain: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
  },

  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  profileInitial: {
    color: "#fff",
    fontWeight: "700",
  },

  hero: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },

  heroLabel: {
    color: "rgba(255,255,255,0.6)",
  },

  heroValue: {
    fontSize: 42,
    color: "#fff",
    fontWeight: "800",
  },

  heroHint: {
    color: "rgba(255,255,255,0.6)",
    marginTop: 6,
  },

  card: {
    flex: 1,
    marginTop: Spacing.xl,
    backgroundColor: "rgba(20,22,28,0.95)",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },

  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },

  actions: {
    flexDirection: "row",
    gap: Spacing.md,
  },

  actionButton: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },

  actionIcon: {
    fontSize: 26,
  },

  actionLabel: {
    marginTop: 4,
    color: "#fff",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },

  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },

  rowLabel: {
    color: "rgba(255,255,255,0.6)",
  },

  rowLabelBold: {
    color: "#fff",
    fontWeight: "800" as const,
  },

  rowValue: {
    color: "#f8f1f1",
    fontWeight: "700",
  },

  rowValueBold: {
    fontWeight: "900" as const,
    fontSize: 18,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  expenseList: {
    gap: 12,
  },

  emptyText: {
    color: "rgba(255,255,255,0.6)",
  },
});