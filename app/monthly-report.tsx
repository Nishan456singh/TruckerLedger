import {
    BorderRadius,
    CategoryMeta,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
    type Category,
} from "@/constants/theme";
import {
    getCategoryTotals,
    getMonthlyExpenses,
    getMonthlyTotal,
    getReceiptCount,
} from "@/lib/expenseService";
import { router, useFocusEffect } from "expo-router";
import ScreenBackground from "@/components/ScreenBackground";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    type DimensionValue,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORY_ORDER: Category[] = [
  "fuel",
  "toll",
  "parking",
  "food",
  "repair",
  "other",
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function shiftMonth(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function getDisplayDays(date: Date): number {
  const now = new Date();
  const isCurrentMonth =
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();

  if (isCurrentMonth) return now.getDate();

  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export default function MonthlyReportScreen() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

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
    const days = Math.max(1, getDisplayDays(selectedMonth));
    return total / days;
  }, [selectedMonth, total]);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const month = selectedMonth.getMonth() + 1;
      const year = selectedMonth.getFullYear();

      const [totalsByCategory, monthTotal, monthExpenses, monthReceiptCount] =
        await Promise.all([
          getCategoryTotals(month, year),
          getMonthlyTotal(month, year),
          getMonthlyExpenses(month, year),
          getReceiptCount(month, year),
        ]);

      setCategoryTotals(totalsByCategory);
      setTotal(monthTotal);
      setTripsLogged(monthExpenses.length);
      setReceiptsScanned(monthReceiptCount);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const now = new Date();
  const canGoNext =
    selectedMonth.getFullYear() < now.getFullYear() ||
    (selectedMonth.getFullYear() === now.getFullYear() &&
      selectedMonth.getMonth() < now.getMonth());

  return (
    <ScreenBackground>
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Monthly Report</Text>

        <View style={{ width: 36 }} />
      </View>

      <View style={styles.monthNav}>
        <TouchableOpacity
          style={styles.monthArrowBtn}
          onPress={() => setSelectedMonth((prev) => shiftMonth(prev, -1))}
        >
          <Text style={styles.monthArrowText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.monthLabel}>{monthLabel}</Text>

        <TouchableOpacity
          style={[styles.monthArrowBtn, !canGoNext && styles.monthArrowDisabled]}
          onPress={() => canGoNext && setSelectedMonth((prev) => shiftMonth(prev, 1))}
          disabled={!canGoNext}
        >
          <Text style={styles.monthArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Loading monthly report...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {CATEGORY_ORDER.map((category) => {
              const meta = CategoryMeta[category];
              const amount = categoryTotals[category] ?? 0;
              const widthPct: DimensionValue =
                total > 0 ? `${Math.max(6, (amount / total) * 100)}%` : "6%";

              return (
                <View key={category} style={styles.rowBlock}>
                  <View style={styles.rowHeader}>
                    <View style={styles.rowLabelWrap}>
                      <Text style={styles.rowIcon}>{meta.icon}</Text>
                      <Text style={styles.rowLabel}>{meta.label}</Text>
                    </View>

                    <Text style={styles.rowAmount}>{formatCurrency(amount)}</Text>
                  </View>

                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { width: widthPct, backgroundColor: meta.color },
                      ]}
                    />
                  </View>
                </View>
              );
            })}

            <View style={styles.totalDivider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Driver Stats</Text>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Trips Logged</Text>
              <Text style={styles.statValue}>{tripsLogged}</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Receipts Scanned</Text>
              <Text style={styles.statValue}>{receiptsScanned}</Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Average Expense Per Day</Text>
              <Text style={styles.statValue}>{formatCurrency(averagePerDay)}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontSize: 28,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  title: {
    fontSize: FontSize.section,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  monthNav: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...Shadow.card,
  },
  monthArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cardAlt,
  },
  monthArrowDisabled: {
    opacity: 0.5,
  },
  monthArrowText: {
    fontSize: 24,
    lineHeight: 26,
    color: Colors.textPrimary,
  },
  monthLabel: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  rowBlock: {
    marginBottom: Spacing.md,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  rowLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  rowIcon: {
    fontSize: 16,
  },
  rowLabel: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },
  rowAmount: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  barTrack: {
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.border,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: BorderRadius.full,
  },
  totalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: FontSize.section,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  totalValue: {
    fontSize: FontSize.section,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
  },
  sectionTitle: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  statLabel: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },
  statValue: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
});
