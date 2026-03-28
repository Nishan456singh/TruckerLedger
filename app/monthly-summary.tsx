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
import { getCurrentMonthCategoryTotals } from "@/lib/expenseService";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

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
      const nextTotals = await getCurrentMonthCategoryTotals();
      setTotals(nextTotals);
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
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Monthly Summary</Text>
          <Text style={styles.subtitle}>{monthLabel}</Text>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading month totals...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total This Month</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalMonth)}</Text>
          </View>

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
    gap: Spacing.md,
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
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.section,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    marginTop: 2,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  totalCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  totalLabel: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  totalValue: {
    marginTop: Spacing.xs,
    fontSize: FontSize.section,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
  },
  row: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
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
  rowValue: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
});
