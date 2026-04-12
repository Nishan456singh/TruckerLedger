import ScreenBackground from "@/components/ScreenBackground";
import { getShadow } from "@/constants/shadowUtils";
import {
    BorderRadius,
    CategoryMeta,
    Colors,
    FontWeight,
    Shadow,
    Spacing,
    TypographyScale,
    type Category
} from "@/constants/theme";
import { getCurrentMonthCategoryTotals, getMonthlyProfit } from "@/lib/expenseService";
import { formatCurrency } from "@/lib/formatUtils";
import type { MonthlyProfit } from "@/lib/expenseService";
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

const ORDERED_CATEGORIES: Category[] = [
  "fuel",
  "food",
  "repair",
  "parking",
  "toll",
  "other",
];

export default function MonthlySummaryScreen() {
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<Record<Category, number>>({
    fuel: 0,
    food: 0,
    repair: 0,
    parking: 0,
    toll: 0,
    other: 0,
  });
  const [profit, setProfit] = useState<MonthlyProfit>({
    bolIncome: 0,
    expenses: 0,
    profit: 0,
  });

  const totalMonth = useMemo(
    () => Object.values(totals).reduce((sum, amount) => sum + amount, 0),
    [totals]
  );

  const monthLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    []
  );

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [nextTotals, profitData] = await Promise.all([
        getCurrentMonthCategoryTotals(),
        getMonthlyProfit(),
      ]);
      setTotals(nextTotals);
      setProfit(profitData);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <LinearGradient
          colors={[Colors.secondary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Animated.View entering={FadeInDown.springify()} style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>

            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Monthly Summary</Text>
              <Text style={styles.subtitle}>{monthLabel}</Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading month totals...</Text>
          </View>
        ) : (
          <View style={styles.floatingContainer}>
            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* PROFIT SECTION */}
              <Animated.View entering={FadeInDown.springify()} style={styles.profitSection}>
                <View style={styles.profitCard}>
                  <View style={styles.profitRow}>
                    <Text style={styles.profitLabel}>BOL Income</Text>
                    <Text style={[styles.profitValue, { color: "#3EE58A" }]}>
                      {formatCurrency(profit.bolIncome)}
                    </Text>
                  </View>

                  <View style={[styles.profitRow, styles.profitRowBorder]}>
                    <Text style={styles.profitLabel}>Expenses</Text>
                    <Text style={[styles.profitValue, { color: "#FF5A5A" }]}>
                      -{formatCurrency(profit.expenses)}
                    </Text>
                  </View>

                  <View style={styles.profitRow}>
                    <Text style={styles.profitLabelBold}>Net Profit</Text>
                    <Text
                      style={[
                        styles.profitValueBold,
                        { color: profit.profit >= 0 ? "#3EE58A" : "#FF5A5A" },
                      ]}
                    >
                      {formatCurrency(profit.profit)}
                    </Text>
                  </View>
                </View>
              </Animated.View>

              {/* EXPENSES BREAKDOWN */}
              <Animated.View entering={FadeInDown.delay(80).springify()}>
                <View style={styles.totalCard}>
                  <Text style={styles.totalLabel}>Expenses Breakdown</Text>
                  <Text style={styles.totalValue}>{formatCurrency(totalMonth)}</Text>
                </View>
              </Animated.View>

              {ORDERED_CATEGORIES.map((category, index) => {
                const meta = CategoryMeta[category];
                const amount = totals[category] ?? 0;

                return (
                  <Animated.View
                    key={category}
                    entering={FadeInDown.delay(80 + index * 50).springify()}
                    style={styles.row}
                  >
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowIcon}>{meta.icon}</Text>
                      <Text style={styles.rowLabel}>{meta.label}</Text>
                    </View>

                    <Text style={[styles.rowValue, { color: meta.color }]}>
                      {formatCurrency(amount)}
                    </Text>
                  </Animated.View>
                );
              })}
            </ScrollView>
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
  hero: {
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  backBtn: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.textInverse,
    ...getShadow(Shadow.small),
  },
  backText: {
    fontSize: 28,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    ...TypographyScale.headline,
    color: Colors.textInverse,
  },
  subtitle: {
    marginTop: Spacing.xs,
    ...TypographyScale.small,
    color: Colors.textInverse,
  },
  floatingContainer: {
    flex: 1,
    marginTop: -Spacing.xl,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    backgroundColor: Colors.background,
    ...getShadow(Shadow.large),
    overflow: "hidden",
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  loadingText: {
    ...TypographyScale.small,
    color: Colors.textMuted,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
    gap: Spacing.lg,
  },
  totalCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    ...getShadow(Shadow.small),
  },
  totalLabel: {
    ...TypographyScale.caption,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  totalValue: {
    marginTop: Spacing.sm,
    ...TypographyScale.display,
    color: Colors.accent,
  },
  row: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...getShadow(Shadow.small),
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  rowIcon: {
    fontSize: 24,
  },
  rowLabel: {
    ...TypographyScale.body,
    color: Colors.textPrimary,
  },
  rowValue: {
    ...TypographyScale.subtitle,
    fontWeight: FontWeight.bold,
  },
  profitSection: {
    marginBottom: Spacing.sm,
  },
  profitCard: {
    backgroundColor: "rgba(79, 140, 255, 0.08)",
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "rgba(79, 140, 255, 0.2)",
    padding: Spacing.lg,
    ...getShadow(Shadow.small),
  },
  profitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  profitRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(79, 140, 255, 0.1)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(79, 140, 255, 0.1)",
  },
  profitLabel: {
    ...TypographyScale.body,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  profitLabelBold: {
    ...TypographyScale.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  profitValue: {
    ...TypographyScale.subtitle,
    fontWeight: FontWeight.bold,
  },
  profitValueBold: {
    fontSize: 20,
    fontWeight: "800" as const,
  },
});
