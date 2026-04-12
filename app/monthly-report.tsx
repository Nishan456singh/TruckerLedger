import ScreenBackground from "@/components/ScreenBackground";
import { getShadow } from "@/constants/shadowUtils";
import {
  BorderRadius,
  CategoryMeta,
  Colors,
  FontSize,
  FontWeight,
  Shadow,
  Spacing,
  TypographyScale,
  type Category,
} from "@/constants/theme";

import {
  getCategoryTotals,
  getMonthlyExpenses,
  getMonthlyTotal,
  getReceiptCount,
} from "@/lib/expenseService";

import { formatCurrency } from "@/lib/formatUtils";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";

import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

/* ───────── CONSTANTS ───────── */

const CATEGORY_ORDER: Category[] = [
  "fuel",
  "toll",
  "parking",
  "food",
  "repair",
  "other",
];

/* ───────── HELPERS ───────── */

function shiftMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function getDisplayDays(date: Date): number {
  const now = new Date();
  const isCurrentMonth =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth();

  return isCurrentMonth
    ? now.getDate()
    : new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/* ───────── SCREEN ───────── */

export default function MonthlyReportScreen() {
  const [selectedMonth, setSelectedMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  const [loading, setLoading] = useState(true);
  const [categoryTotals, setCategoryTotals] = useState<Record<Category, number>>({
    fuel: 0,
    toll: 0,
    parking: 0,
    food: 0,
    repair: 0,
    other: 0,
  });

  const [total, setTotal] = useState(0);
  const [tripsLogged, setTripsLogged] = useState(0);
  const [receiptsScanned, setReceiptsScanned] = useState(0);

  const monthLabel = useMemo(
    () =>
      selectedMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [selectedMonth]
  );

  const averagePerDay = useMemo(() => {
    return total / Math.max(1, getDisplayDays(selectedMonth));
  }, [selectedMonth, total]);

  const loadData = useCallback(async () => {
    setLoading(true);

    const month = selectedMonth.getMonth() + 1;
    const year = selectedMonth.getFullYear();

    const [totalsByCategory, monthTotal, monthExpenses, receiptCount] =
      await Promise.all([
        getCategoryTotals(month, year),
        getMonthlyTotal(month, year),
        getMonthlyExpenses(month, year),
        getReceiptCount(month, year),
      ]);

    setCategoryTotals(totalsByCategory);
    setTotal(monthTotal);
    setTripsLogged(monthExpenses.length);
    setReceiptsScanned(receiptCount);

    setLoading(false);
  }, [selectedMonth]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const now = new Date();
  const canGoNext =
    selectedMonth.getFullYear() < now.getFullYear() ||
    (selectedMonth.getFullYear() === now.getFullYear() &&
      selectedMonth.getMonth() < now.getMonth());

  /* ───────── UI ───────── */

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["top","left","right","bottom"]}>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.loading}>Loading report...</Text>
          </View>
        ) : (
          <View style={styles.container}>

            {/* HERO */}
            <LinearGradient
              colors={["#0B0D12", "#1A1E28"]}
              style={styles.hero}
            >
              <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.close}>‹</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Report</Text>

                <View style={{ width: 24 }} />
              </View>

              <Text style={styles.month}>{monthLabel}</Text>
              <Text style={styles.total}>{formatCurrency(total)}</Text>

              {/* Month Nav */}
              <View style={styles.nav}>
                <TouchableOpacity onPress={() => setSelectedMonth(prev => shiftMonth(prev, -1))}>
                  <Text style={styles.arrow}>‹</Text>
                </TouchableOpacity>

                <TouchableOpacity disabled={!canGoNext}
                  onPress={() => canGoNext && setSelectedMonth(prev => shiftMonth(prev, 1))}
                >
                  <Text style={[styles.arrow, !canGoNext && { opacity: 0.3 }]}>›</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* CARD */}
            <View style={styles.card}>
              <ScrollView contentContainerStyle={styles.content}>

                {/* BREAKDOWN */}
                <Text style={styles.section}>Breakdown</Text>

                {CATEGORY_ORDER.map((c) => {
                  const meta = CategoryMeta[c];
                  const amount = categoryTotals[c];
                  const widthPercent = total > 0 ? (amount / total) * 100 : 5;

                  return (
                    <View key={c} style={styles.row}>
                      <View style={styles.rowTop}>
                        <Text style={styles.rowLabel}>
                          {meta.icon} {meta.label}
                        </Text>
                        <Text style={styles.rowValue}>
                          {formatCurrency(amount)}
                        </Text>
                      </View>

                      <View style={styles.track}>
                        <View style={[styles.fill, { width: `${widthPercent}%`, backgroundColor: meta.color }]} />
                      </View>
                    </View>
                  );
                })}

                {/* STATS */}
                <Text style={styles.section}>Stats</Text>

                <View style={styles.stats}>
                  <Stat label="Trips" value={tripsLogged} />
                  <Stat label="Receipts" value={receiptsScanned} />
                  <Stat label="Daily Avg" value={formatCurrency(averagePerDay)} />
                </View>

              </ScrollView>
            </View>
          </View>
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
}

/* ───────── COMPONENTS ───────── */

function Stat({ label, value }: any) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

/* ───────── STYLES ───────── */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  container: { flex: 1 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loading: { color: "#aaa", marginTop: 10 },

  /* HERO */
  hero: {
    paddingTop: 40,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  close: { color: "#fff", fontSize: 28 },

  title: { color: "#fff", fontWeight: "600" },

  month: {
    color: "#aaa",
    marginTop: 20,
  },

  total: {
    fontSize: 40,
    color: "#fff",
    fontWeight: "800",
    marginTop: 10,
  },

  nav: {
    flexDirection: "row",
    gap: 20,
    marginTop: 20,
  },

  arrow: {
    fontSize: 26,
    color: "#fff",
  },

  /* CARD */
  card: {
    flex: 1,
    marginTop: -30,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  content: {
    gap: Spacing.lg,
  },

  section: {
    color: "#fff",
    fontWeight: "600",
  },

  row: { gap: 6 },

  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  rowLabel: { color: "#aaa" },

  rowValue: { color: "#fff" },

  track: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 10,
  },

  fill: {
    height: 6,
    borderRadius: 10,
  },

  stats: {
    flexDirection: "row",
    gap: 10,
  },

  stat: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  statLabel: {
    color: "#888",
    fontSize: 12,
  },

  statValue: {
    color: "#fff",
    fontWeight: "700",
    marginTop: 6,
  },
});