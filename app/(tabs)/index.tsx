import ExpenseCard from "@/components/ExpenseCard";
import ScreenBackground from "@/components/ScreenBackground";
import { useAuth } from "@/lib/auth/AuthContext";
import { getAllExpenses } from "@/lib/expenseService";
import { formatCurrency } from "@/lib/formatUtils";
import {
  getMonthlyTripSnapshot,
  getWeeklyTripSnapshot,
} from "@/lib/tripService";
import type { Expense } from "@/lib/types";
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from "@/constants/theme";
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
    const [w, m, e] = await Promise.all([
      getWeeklyTripSnapshot(),
      getMonthlyTripSnapshot(),
      getAllExpenses(),
    ]);

    setWeekly(w);
    setMonthly(m);
    setExpenses(e.slice(0, 4));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch(console.error);
    }, [load])
  );

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <LinearGradient
          colors={["#C3224E", "#8E1B3B"]}
          style={styles.container}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Hey, {name}</Text>

            <TouchableOpacity
              style={styles.profile}
              onPress={() => router.push("/profile")}
            >
              <Text style={styles.profileText}>
                {name[0]}
              </Text>
            </TouchableOpacity>
          </View>

          {/* PROFIT */}
          <View style={styles.center}>
            <Text style={styles.label}>Weekly Profit</Text>
            <Text style={styles.value}>
              {formatCurrency(weekly.profit)}
            </Text>
          </View>

          {/* WHITE CARD */}
          <View style={styles.card}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refresh}
                />
              }
            >
              {/* ACTIONS */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => router.push("/scan-receipt")}
                >
                  <Text style={styles.btnText}>Add</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => router.push("/history")}
                >
                  <Text style={styles.btnText}>History</Text>
                </TouchableOpacity>
              </View>

              {/* MONTH */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Monthly Summary</Text>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Income</Text>
                  <Text style={styles.rowValue}>{formatCurrency(monthly.income)}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Expense</Text>
                  <Text style={styles.rowValue}>
                    {formatCurrency(
                      monthly.fuel + monthly.otherExpenses
                    )}
                  </Text>
                </View>
              </View>

              {/* RECENT */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Expenses</Text>

                {expenses.length === 0 ? (
                  <Text style={styles.empty}>
                    No expenses yet
                  </Text>
                ) : (
                  expenses.map((e) => (
                    <ExpenseCard key={e.id} expense={e} />
                  ))
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

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },

  greeting: {
    color: "#fff",
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
  },

  profile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  profileText: {
    color: "#fff",
    fontWeight: FontWeight.bold,
    fontSize: FontSize.body,
  },

  center: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },

  label: {
    color: "rgba(255,255,255,0.7)",
    fontSize: FontSize.body,
  },

  value: {
    fontSize: 32,
    color: "#fff",
    fontWeight: FontWeight.extrabold,
    marginTop: Spacing.sm,
  },

  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    marginTop: Spacing.xl,
    overflow: "hidden",
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
  },

  actions: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },

  btn: {
    flex: 1,
    backgroundColor: "#C3224E",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: FontWeight.bold,
    fontSize: FontSize.body,
  },

  section: {
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },

  rowLabel: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },

  rowValue: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },

  empty: {
    textAlign: "center",
    paddingVertical: Spacing.xl,
    color: Colors.textMuted,
    fontSize: FontSize.body,
  },
});