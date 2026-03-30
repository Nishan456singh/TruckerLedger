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
import { getCurrentMonthCategoryTotals } from "@/lib/expenseService";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
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
});
