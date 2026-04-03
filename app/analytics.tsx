import { getShadow } from "@/constants/shadowUtils";
import {
  BorderRadius,
  Colors,
  FontSize,
  FontWeight,
  Shadow,
  Spacing,
  TypographyScale,
  Gradients,
} from "@/constants/theme";
import { formatCurrency } from "@/lib/formatUtils";
import {
  getCategoryAnalysis,
  getDailyStats,
  getProfitTrend,
  type CategoryAnalysis,
} from "@/lib/tripService";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
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
import Animated, { FadeInDown } from "react-native-reanimated";

/* ───────────────────────────────────────────── */

interface DailyStatsData {
  bestDay: { date: string; profit: number };
  worstDay: { date: string; profit: number };
  averageDailyProfit: number;
  totalDays: number;
}

interface TrendData {
  date: string;
  profit: number;
  income: number;
  expenses: number;
}

/* ───────────────────────────────────────────── */

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/* ───────────────────────────────────────────── */

function getCategoryColor(category: string) {
  const map: Record<string, string> = {
    fuel: Colors.fuel,
    toll: Colors.toll,
    parking: Colors.parking,
    food: Colors.food,
    repair: Colors.repair,
    other: Colors.other,
  };
  return map[category] || Colors.primary;
}

/* ───────────────────────────────────────────── */

export default function AnalyticsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStatsData | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    try {
      const [trends, daily, categories] = await Promise.all([
        getProfitTrend(30),
        getDailyStats(),
        getCategoryAnalysis(),
      ]);

      setTrendData(trends);
      setDailyStats(daily);
      setCategoryData(categories);
    } catch (err) {
      console.error("Analytics error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [loadAnalytics])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const maxProfit =
    Math.max(...trendData.map((d) => d.profit), 1) || 1;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <Text style={[styles.loadingText, { color: Colors.textPrimary }]}>
          Loading analytics...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      {/* HERO GRADIENT */}
      <LinearGradient
        colors={Gradients.bluePrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>📊 Analytics</Text>
        </View>
      </LinearGradient>

      {/* FLOATING CARD CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.floatingCard}>
          {/* DAILY STATS */}
          {dailyStats && (
            <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
              <Text style={styles.sectionTitle}>Daily Performance</Text>

              <View style={styles.statsGrid}>
                <StatBox
                  label="Best"
                  value={dailyStats.bestDay.profit}
                  date={dailyStats.bestDay.date}
                />
                <StatBox
                  label="Worst"
                  value={dailyStats.worstDay.profit}
                  date={dailyStats.worstDay.date}
                />
                <StatBox
                  label="Average"
                  value={dailyStats.averageDailyProfit}
                  date={`${dailyStats.totalDays} days`}
                />
              </View>
            </Animated.View>
          )}

          {/* TREND */}
          {trendData.length > 0 && (
            <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
              <Text style={styles.sectionTitle}>Profit Trend</Text>

              <View style={styles.trendContainer}>
                {trendData.slice(0, 10).map((d, i) => (
                  <View key={i} style={styles.chartRow}>
                    <Text style={styles.chartLabel}>
                      {formatDate(d.date)}
                    </Text>

                    <View style={styles.barBg}>
                      <View
                        style={[
                          styles.bar,
                          {
                            width: `${
                              Math.max((d.profit / maxProfit) * 100, 5)
                            }%`,
                            backgroundColor:
                              d.profit >= 0
                                ? Colors.primary
                                : Colors.danger,
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.chartValue}>
                      {formatCurrency(d.profit)}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* CATEGORY */}
          {categoryData.length > 0 && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
              <Text style={styles.sectionTitle}>Categories</Text>

              <View style={styles.categoryContainer}>
                {categoryData.map((c, i) => (
                  <View key={i} style={styles.categoryRow}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: getCategoryColor(c.category) },
                      ]}
                    />
                    <Text style={styles.categoryName}>
                      {c.category}
                    </Text>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(c.totalAmount)}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          <View style={{ height: Spacing.xxxxl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ───────── COMPONENTS ───────── */

function StatBox({
  label,
  value,
  date,
}: {
  label: string;
  value: number;
  date: string;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{formatCurrency(value)}</Text>
      <Text style={styles.statDate}>
        {date.includes("-") ? formatDate(date) : date}
      </Text>
    </View>
  );
}

/* ───────── STYLES ───────── */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* HERO SECTION */
  hero: {
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },

  backBtn: {
    width: Spacing.xxxl,
    height: Spacing.xxxl,
    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    fontSize: FontSize.headerIcon,
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },

  title: {
    ...TypographyScale.headline,
    color: Colors.textInverse,
    flex: 1,
  },

  /* FLOATING CARD */
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
  },

  floatingCard: {
    marginTop: -Spacing.xl,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...getShadow(Shadow.large),
  },

  /* SECTIONS */
  section: {
    marginBottom: Spacing.lg,
    gap: Spacing.lg,
  },

  sectionTitle: {
    ...TypographyScale.title,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  /* STATS GRID */
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  statBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...getShadow(Shadow.small),
  },

  statLabel: {
    ...TypographyScale.small,
    color: Colors.textMuted,
  },

  statValue: {
    ...TypographyScale.subtitle,
    color: Colors.primary,
  },

  statDate: {
    ...TypographyScale.caption,
    color: Colors.textMuted,
  },

  /* TREND CHART */
  trendContainer: {
    gap: Spacing.md,
  },

  chartRow: {
    gap: Spacing.md,
  },

  chartLabel: {
    ...TypographyScale.small,
    color: Colors.textMuted,
  },

  barBg: {
    height: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },

  bar: {
    height: "100%",
  },

  chartValue: {
    ...TypographyScale.small,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },

  /* CATEGORY LIST */
  categoryContainer: {
    gap: Spacing.sm,
  },

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },

  dot: {
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: BorderRadius.full,
  },

  categoryName: {
    flex: 1,
    ...TypographyScale.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },

  categoryAmount: {
    ...TypographyScale.small,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },

  loadingText: {
    textAlign: "center",
    marginTop: Spacing.xxxl,
    ...TypographyScale.body,
  },
});
