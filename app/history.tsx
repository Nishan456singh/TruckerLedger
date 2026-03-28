import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import BOLCard from "@/components/BOLCard";
import ExpenseCard from "@/components/ExpenseCard";
import HistoryFilterPills, { type FilterType } from "@/components/HistoryFilterPills";
import ScreenBackground from "@/components/ScreenBackground";
import SearchBar from "@/components/SearchBar";
import {
    Colors,
    FontSize,
    FontWeight,
    Spacing,
    Shadow,
    TypographyScale
} from "@/constants/theme";
import { getBOLHistory } from "@/lib/bolService";
import { getAllExpenses } from "@/lib/expenseService";
import { formatCurrency } from "@/lib/formatUtils";
import type { BOLRecord, Expense } from "@/lib/types";

type HistoryItem =
  | { type: 'expense'; id: number; date: string; data: Expense }
  | { type: 'bol'; id: number; date: string; data: BOLRecord };

interface Section {
  title: string;
  data: HistoryItem[];
  total: number;
}

function groupByDate(items: HistoryItem[]): Section[] {
  const map = new Map<string, HistoryItem[]>();

  for (const item of items) {
    const list = map.get(item.date) ?? [];
    list.push(item);
    map.set(item.date, list);
  }

  const sections: Section[] = [];

  for (const [date, items] of map.entries()) {
    const total = items.reduce((sum, i) => {
      if (i.type === 'expense') return sum + i.data.amount;
      if (i.type === 'bol') return sum + (i.data.load_amount ?? 0);
      return sum;
    }, 0);
    sections.push({ title: date, data: items, total });
  }

  return sections.sort((a, b) => b.title.localeCompare(a.title));
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function yesterdayISO() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function formatSectionDate(dateStr: string): string {
  const today = todayISO();
  const yesterday = yesterdayISO();

  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";

  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function HistoryScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bols, setBols] = useState<BOLRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [expensesData, bolsData] = await Promise.all([
        getAllExpenses(),
        getBOLHistory(),
      ]);
      setExpenses(expensesData);
      setBols(bolsData);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase();
    let items: HistoryItem[] = [];

    // Filter by type
    if (filterType === 'all' || filterType === 'receipts') {
      const filtered = expenses
        .filter(e => {
          if (!q) return true;
          return (
            e.category.toLowerCase().includes(q) ||
            (e.note ?? "").toLowerCase().includes(q) ||
            String(e.amount).includes(q)
          );
        })
        .map(e => ({ type: 'expense' as const, id: e.id, date: e.date, data: e }));
      items.push(...filtered);
    }

    if (filterType === 'all' || filterType === 'bols') {
      const filtered = bols
        .filter(b => {
          if (!q) return true;
          return (
            (b.broker ?? "").toLowerCase().includes(q) ||
            (b.pickup_location ?? "").toLowerCase().includes(q) ||
            (b.delivery_location ?? "").toLowerCase().includes(q) ||
            String(b.load_amount).includes(q)
          );
        })
        .map(b => ({ type: 'bol' as const, id: b.id, date: b.date, data: b }));
      items.push(...filtered);
    }

    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, bols, searchQuery, filterType]);

  const sections = useMemo(() => groupByDate(filteredItems), [filteredItems]);

  const totalAmount = useMemo(
    () => filteredItems.reduce((sum, i) => {
      if (i.type === 'expense') return sum + i.data.amount;
      if (i.type === 'bol') return sum + (i.data.load_amount ?? 0);
      return sum;
    }, 0),
    [filteredItems]
  );

  if (loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <View style={styles.container}>
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* HERO SECTION (RED - History themed)                            */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          <LinearGradient
            colors={[Colors.accent, '#A01B3A']}
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
              <Text style={styles.heroTitle}>History</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Centered Total Display */}
            <View style={styles.heroTotalCenter}>
              <Text style={styles.heroTotalLabel}>
                {filterType === 'receipts' ? 'Total Receipts' : filterType === 'bols' ? 'Total BOLs' : 'Total Amount'}
              </Text>
              <Text style={styles.heroTotalValue}>{formatCurrency(totalAmount)}</Text>
              <Text style={styles.heroTotalEmoji}>{filterType === 'receipts' ? '🧾' : filterType === 'bols' ? '📄' : '📋'}</Text>
            </View>
          </LinearGradient>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* FLOATING CARD (Content)                                        */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          <View style={styles.floatingCardContainer}>
            <ScrollView
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Search Bar */}
              <Animated.View entering={FadeInDown} style={styles.searchSection}>
                <SearchBar
                  placeholder="Search receipts, BOLs..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </Animated.View>

              {/* Filter Pills */}
              <Animated.View entering={FadeInDown.delay(50)} style={styles.filterSection}>
                <HistoryFilterPills
                  activeFilter={filterType}
                  onFilterChange={setFilterType}
                />
              </Animated.View>

              {/* List or Empty State */}
              {sections.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>📭</Text>
                  <Text style={styles.emptyTitle}>
                    {searchQuery || filterType !== 'all'
                      ? "No matching items"
                      : "No history yet"}
                  </Text>
                  <Text style={styles.emptyDesc}>
                    {searchQuery || filterType !== 'all'
                      ? "Try adjusting your filters"
                      : "Add receipts or BOLs to get started"}
                  </Text>
                </View>
              ) : (
                <SectionList
                  sections={sections}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  scrollEnabled={false}
                  renderSectionHeader={({ section }) => (
                    <Animated.View entering={FadeInDown} style={styles.sectionHeader}>
                      <Text style={styles.sectionDate}>
                        {formatSectionDate(section.title)}
                      </Text>
                      <Text style={styles.sectionTotal}>
                        {formatCurrency(section.total)}
                      </Text>
                    </Animated.View>
                  )}
                  renderItem={({ item, index }) => (
                    <Animated.View entering={FadeInDown.delay(index * 40)}>
                      {item.type === 'expense' ? (
                        <TouchableOpacity
                          style={styles.itemWrapper}
                          onPress={() =>
                            router.push({
                              pathname: "/expense-detail",
                              params: { id: item.data.id },
                            })
                          }
                          activeOpacity={0.7}
                        >
                          <ExpenseCard expense={item.data} />
                        </TouchableOpacity>
                      ) : (
                        <BOLCard bol={item.data} />
                      )}
                    </Animated.View>
                  )}
                  ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                  stickySectionHeadersEnabled={false}
                />
              )}
            </ScrollView>
          </View>
        </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ─── HERO SECTION ───────────────────────────────────────────

  heroSection: {
    flex: 0.5,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.lg,
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

  heroTotalCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },

  heroTotalLabel: {
    fontSize: FontSize.caption,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.5,
  },

  heroTotalValue: {
    fontSize: 52,
    fontWeight: FontWeight.extrabold,
    color: Colors.textInverse,
    lineHeight: 56,
  },

  heroTotalEmoji: {
    fontSize: 44,
    marginTop: Spacing.xs,
  },

  // ─── FLOATING CARD ──────────────────────────────────────────

  floatingCardContainer: {
    flex: 0.55,
    marginTop: -Spacing.lg,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: 32,
    overflow: "hidden",
    ...Shadow.large,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  // ─── SEARCH SECTION ─────────────────────────────────────────

  searchSection: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  // ─── FILTER SECTION ─────────────────────────────────────────

  filterSection: {
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.md,
  },

  // ─── LIST CONTENT ───────────────────────────────────────────

  listContent: {
    paddingBottom: Spacing.xl,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginHorizontal: -Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },

  sectionDate: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  sectionTotal: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.extrabold,
    color: Colors.accent,
  },

  itemWrapper: {
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },

  // ─── EMPTY STATE ────────────────────────────────────────────

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxl,
    gap: Spacing.lg,
    marginTop: Spacing.xl,
  },

  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },

  emptyTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  emptyDesc: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    textAlign: "center",
    paddingHorizontal: Spacing.lg,
    lineHeight: 22,
  },
});
