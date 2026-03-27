import HighContrastCard from '@/components/HighContrastCard';
import ScreenBackground from '@/components/ScreenBackground';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import { formatCurrency } from '@/lib/formatUtils';
import { getCategoryAnalysis, getDailyStats, getProfitTrend, type CategoryAnalysis } from '@/lib/tripService';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SimpleChart({
  title,
  data,
  maxValue,
}: {
  title: string;
  data: { label: string; value: number; color?: string }[];
  maxValue: number;
}) {
  const maxBarWidth = 200;

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      {data.map((item, idx) => (
        <View key={idx} style={styles.chartBar}>
          <Text style={styles.chartLabel}>{item.label}</Text>
          <View style={styles.barBackground}>
            <View
              style={[
                styles.bar,
                {
                  width: `${Math.max((item.value / maxValue) * 100, 5)}%`,
                  backgroundColor: item.color || Colors.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.chartValue}>{formatCurrency(item.value)}</Text>
        </View>
      ))}
    </View>
  );
}

function PieChart({ data }: { data: CategoryAnalysis[] }) {
  const totalPercentage = data.reduce((sum, item) => sum + item.percentage, 0);

  return (
    <View style={styles.pieContainer}>
      <Text style={styles.chartTitle}>Expense Breakdown</Text>
      {data.map((item, idx) => (
        <View key={idx} style={styles.pieRow}>
          <View
            style={[
              styles.pieLegend,
              { backgroundColor: getCategoryColor(item.category) },
            ]}
          />
          <View style={styles.pieLabel}>
            <Text style={styles.pieLabelText}>
              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
            </Text>
            <Text style={styles.pieLabelValue}>{item.percentage}%</Text>
          </View>
          <View style={styles.pieBar}>
            <View
              style={[
                styles.pieBarFill,
                {
                  width: `${item.percentage}%`,
                  backgroundColor: getCategoryColor(item.category),
                },
              ]}
            />
          </View>
          <Text style={styles.pieAmount}>{formatCurrency(item.totalAmount)}</Text>
        </View>
      ))}
    </View>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    fuel: Colors.fuel,
    toll: Colors.toll,
    parking: Colors.parking,
    food: Colors.food,
    repair: Colors.repair,
    other: Colors.other,
  };
  return colors[category] || Colors.textSecondary;
}

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
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadAnalytics();
  }, [loadAnalytics]));

  async function handleRefresh() {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  }

  const maxProfit = Math.max(
    ...(trendData.map((d) => d.profit) || [1]),
    dailyStats?.bestDay.profit || 1
  );

  const maxExpenses =
    Math.max(...(categoryData.map((c) => c.totalAmount) || [1])) || 1;

  if (loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>📊 Analytics</Text>
          <View style={{ width: 48 }} />
        </Animated.View>

        {/* Daily Stats */}
        {dailyStats && (
          <Animated.View
            entering={FadeInDown.delay(100)}
            style={styles.section}
          >
            <HighContrastCard>
              <Text style={styles.sectionTitle}>📈 Daily Performance</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Best Day</Text>
                  <Text style={[styles.statValue, { color: Colors.primary }]}>
                    {formatCurrency(dailyStats.bestDay.profit)}
                  </Text>
                  <Text style={styles.statDate}>
                    {formatDate(dailyStats.bestDay.date)}
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Worst Day</Text>
                  <Text
                    style={[
                      styles.statValue,
                      { color: dailyStats.worstDay.profit < 0 ? Colors.danger : Colors.primary },
                    ]}
                  >
                    {formatCurrency(dailyStats.worstDay.profit)}
                  </Text>
                  <Text style={styles.statDate}>
                    {formatDate(dailyStats.worstDay.date)}
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Daily Average</Text>
                  <Text style={[styles.statValue, { color: Colors.accent }]}>
                    {formatCurrency(dailyStats.averageDailyProfit)}
                  </Text>
                  <Text style={styles.statDate}>
                    {dailyStats.totalDays} days tracked
                  </Text>
                </View>
              </View>
            </HighContrastCard>
          </Animated.View>
        )}

        {/* Profit Trend */}
        {trendData.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(200)}
            style={styles.section}
          >
            <SimpleChart
              title="📈 Profit Trend (Last 30 Days)"
              data={trendData.map((d) => ({
                label: formatDate(d.date),
                value: d.profit,
                color: d.profit >= 0 ? Colors.primary : Colors.danger,
              }))}
              maxValue={maxProfit}
            />
          </Animated.View>
        )}

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(300)}
            style={styles.section}
          >
            <HighContrastCard>
              <PieChart data={categoryData} />

              <View style={styles.categoryList}>
                <Text style={styles.categoryListTitle}>Expense Details</Text>
                {categoryData.map((cat, idx) => (
                  <View key={idx} style={styles.categoryItem}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: getCategoryColor(cat.category) },
                      ]}
                    />
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>
                        {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                      </Text>
                      <Text style={styles.categoryStats}>
                        {cat.tripCount} trips • {formatCurrency(cat.averagePerTrip)}/trip avg
                      </Text>
                    </View>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(cat.totalAmount)}
                    </Text>
                  </View>
                ))}
              </View>
            </HighContrastCard>
          </Animated.View>
        )}

        {/* Empty State */}
        {trendData.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No data available</Text>
            <Text style={styles.emptySubtitle}>
              Log some trips to see analytics
            </Text>
          </View>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  backBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: FontSize.title,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  title: {
    fontSize: FontSize.section + 2,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.cardAlt,
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statLabel: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  statValue: {
    fontSize: FontSize.body + 2,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  statDate: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },
  chartContainer: {
    gap: Spacing.lg,
    backgroundColor: Colors.cardAlt,
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  chartTitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  chartBar: {
    gap: Spacing.xs,
  },
  chartLabel: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  barBackground: {
    height: 24,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  chartValue: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  pieContainer: {
    gap: Spacing.lg,
  },
  pieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  pieLegend: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  pieLabel: {
    width: 80,
  },
  pieLabelText: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  pieLabelValue: {
    fontSize: FontSize.body - 2,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  pieBar: {
    flex: 1,
    height: 16,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  pieBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  pieAmount: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    width: 70,
    textAlign: 'right',
  },
  categoryList: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  categoryListTitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
  categoryStats: {
    fontSize: FontSize.caption - 2,
    color: Colors.textMuted,
  },
  categoryAmount: {
    fontSize: FontSize.body - 1,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  loadingText: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    textAlign: 'center',
    marginTop: Spacing.xxxl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
