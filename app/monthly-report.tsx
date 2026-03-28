import ScreenBackground from "@/components/ScreenBackground";
import {
    BorderRadius,
    CategoryMeta,
    Colors,
    FontSize,
    FontWeight,
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
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
    FadeInDown,
} from "react-native-reanimated";

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
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Loading monthly report...</Text>
          </View>
        ) : (
          <View style={styles.container}>
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* HERO SECTION (50% - Blue/Analytics themed)                     */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            <LinearGradient
              colors={[Colors.secondary, '#5A8FB5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroSection}
            >
              {/* Top Bar */}
              <View style={styles.heroTopBar}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.heroBackBtn}
                >
                  <Text style={styles.heroBackText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.heroTitle}>Monthly Report</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Centered Month Display */}
              <View style={styles.heroMonthCenter}>
                <Text style={styles.heroMonthLabel}>📊</Text>
                <Text style={styles.heroMonthTitle}>{monthLabel}</Text>
                <Text style={styles.heroMonthSubtitle}>Expense Report</Text>
              </View>

              {/* Month Navigation */}
              <View style={styles.monthNav}>
                <TouchableOpacity
                  style={styles.monthArrowBtn}
                  onPress={() => setSelectedMonth((prev) => shiftMonth(prev, -1))}
                >
                  <Text style={styles.monthArrowText}>‹</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.monthArrowBtn, !canGoNext && styles.monthArrowDisabled]}
                  onPress={() => canGoNext && setSelectedMonth((prev) => shiftMonth(prev, 1))}
                  disabled={!canGoNext}
                >
                  <Text style={styles.monthArrowText}>›</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* FLOATING CARD (50%+ - Content)                                */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            <View style={styles.floatingCardContainer}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.cardContent}
              >
                {/* Expense Breakdown */}
                <Animated.View entering={FadeInDown}>
                  <Text style={styles.cardSectionTitle}>Expense Breakdown</Text>
                  <View style={styles.breakdownContent}>
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
                      <Text style={styles.totalLabel}>Total Expenses</Text>
                      <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                    </View>
                  </View>
                </Animated.View>

                {/* Driver Stats */}
                <Animated.View entering={FadeInDown.delay(50)} style={styles.statsSection}>
                  <Text style={styles.cardSectionTitle}>📈 Driver Stats</Text>

                  <View style={styles.statsGrid}>
                    <View style={styles.statBlock}>
                      <Text style={styles.statBlockLabel}>Trips Logged</Text>
                      <Text style={styles.statBlockValue}>{tripsLogged}</Text>
                    </View>

                    <View style={styles.statBlock}>
                      <Text style={styles.statBlockLabel}>Receipts Scanned</Text>
                      <Text style={styles.statBlockValue}>{receiptsScanned}</Text>
                    </View>

                    <View style={styles.statBlock}>
                      <Text style={styles.statBlockLabel}>Daily Average</Text>
                      <Text style={styles.statBlockValue}>{formatCurrency(averagePerDay)}</Text>
                    </View>
                  </View>
                </Animated.View>
              </ScrollView>
            </View>
          </View>
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

  container: {
    flex: 1,
    position: "relative",
  },

  // ─── HERO SECTION ───────────────────────────────────────────

  heroSection: {
    flex: 0.5,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    justifyContent: "space-between",
  },

  heroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroBackBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  heroBackText: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  heroTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  heroMonthCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },

  heroMonthLabel: {
    fontSize: FontSize.largeIcon,
  },

  heroMonthTitle: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  heroMonthSubtitle: {
    fontSize: FontSize.body,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: FontWeight.medium,
  },

  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },

  monthArrowBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  monthArrowDisabled: {
    opacity: 0.5,
  },

  monthArrowText: {
    fontSize: 24,
    lineHeight: 26,
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },

  // ─── FLOATING CARD ──────────────────────────────────────────

  floatingCardContainer: {
    flex: 0.55,
    marginTop: -Spacing.xxxl,
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },

  cardSectionTitle: {
    fontSize: FontSize.subsection,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // ─── BREAKDOWN ───────────────────────────────────────────────

  breakdownContent: {
    gap: Spacing.md,
  },

  rowBlock: {
    gap: Spacing.xs,
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
    gap: Spacing.sm,
  },

  rowIcon: {
    fontSize: 18,
  },

  rowLabel: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },

  rowAmount: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
  },

  barTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    overflow: "hidden",
  },

  barFill: {
    height: 8,
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
    paddingVertical: Spacing.sm,
  },

  totalLabel: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  totalValue: {
    fontSize: FontSize.section + 2,
    color: Colors.primary,
    fontWeight: FontWeight.extrabold,
  },

  // ─── STATS ──────────────────────────────────────────────────

  statsSection: {
    gap: Spacing.md,
  },

  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },

  statBlock: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  statBlockLabel: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },

  statBlockValue: {
    fontSize: FontSize.section,
    color: Colors.textPrimary,
    fontWeight: FontWeight.extrabold,
  },

  // ─── LOADING ─────────────────────────────────────────────────

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },

  loadingText: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },
});
