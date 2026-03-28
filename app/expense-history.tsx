import ExpenseCard from "@/components/ExpenseCard";
import ScreenBackground from "@/components/ScreenBackground";
import {
    BorderRadius,
    CategoryMeta,
    Colors,
    FontSize,
    FontWeight,
    Spacing,
} from "@/constants/theme";
import type { Category, Expense } from "@/lib/types";
import { exportExpenses, getAllExpenses } from "@/lib/expenseService";
import { formatCurrency } from "@/lib/formatUtils";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    Alert,
    RefreshControl,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface Section {
  title: string;
  data: Expense[];
  total: number;
}

function groupByDate(expenses: Expense[]): Section[] {
  const map = new Map<string, Expense[]>();

  for (const e of expenses) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }

  const sections: Section[] = [];

  for (const [date, items] of map.entries()) {
    const total = items.reduce((sum, i) => sum + i.amount, 0);
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

interface FilterChipProps {
  label: string;
  icon?: string;
  active: boolean;
  onPress: () => void;
}

function FilterChip({ label, icon, active, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.chip, active && styles.chipActive]}
    >
      {icon && <Text style={styles.chipIcon}>{icon}</Text>}
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function ExpenseHistoryScreen() {
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<Category | "all">("all");
  const [dateRange, setDateRange] = useState<"all" | "week" | "month">("all");
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function loadExpenses() {
    const data = await getAllExpenses();
    setAllExpenses(data);
  }

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  }

  async function handleExportCsv() {
    if (exporting) return;

    setExporting(true);

    try {
      const csv = await exportExpenses();

      if (!csv || csv.trim() === "Date,Category,Amount,Note") {
        Alert.alert("No Data", "You have no expenses to export yet.");
        return;
      }

      const shareAvailable = await Sharing.isAvailableAsync();

      if (!shareAvailable) {
        Alert.alert("Not Available", "Sharing is not available on this device.");
        return;
      }

      const file = new File(Paths.cache, `truckledger_expenses_${Date.now()}.csv`);
      await file.write(csv);

      await Sharing.shareAsync(file.uri, {
        mimeType: "text/csv",
        dialogTitle: "Export Expenses",
        UTI: "public.comma-separated-values-text",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to export expenses.";
      Alert.alert("Export Failed", message);
    } finally {
      setExporting(false);
    }
  }

  const filtered = allExpenses.filter((e) => {
    const matchesCategory =
      selectedCategory === "all" || e.category === selectedCategory;

    const q = search.toLowerCase();

    const matchesSearch =
      !q ||
      e.category.toLowerCase().includes(q) ||
      (e.note ?? "").toLowerCase().includes(q) ||
      String(e.amount).includes(q);

    // Date range filter
    let matchesDateRange = true;
    if (dateRange !== "all") {
      const expenseDate = new Date(e.date);
      const now = new Date();

      if (dateRange === "week") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        matchesDateRange = expenseDate >= sevenDaysAgo;
      } else if (dateRange === "month") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        matchesDateRange = expenseDate >= monthStart;
      }
    }

    return matchesCategory && matchesSearch && matchesDateRange;
  });

  const sections = groupByDate(filtered);

  const grandTotal = filtered.reduce((sum, e) => sum + e.amount, 0);

  const categories: (Category | "all")[] = [
    "all",
    "fuel",
    "toll",
    "parking",
    "food",
    "repair",
    "other",
  ];

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <View style={styles.container}>
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* HERO SECTION (50% - Red/Expense themed)                        */}
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
              <Text style={styles.heroTitle}>Expense History</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Centered Total Display */}
            <View style={styles.heroTotalCenter}>
              <Text style={styles.heroTotalLabel}>Total Expenses</Text>
              <Text style={styles.heroTotalValue}>{formatCurrency(grandTotal)}</Text>
              <Text style={styles.heroTotalEmoji}>💸</Text>
            </View>
          </LinearGradient>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* FLOATING CARD (50%+ - Content)                                */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          <View style={styles.floatingCardContainer}>
            {/* Search Container */}
            <Animated.View entering={FadeInDown} style={styles.searchRow}>
              <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search expenses..."
                  placeholderTextColor={Colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <Text style={styles.searchClear}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

            {/* Category Filters */}
            <Animated.View entering={FadeInDown.delay(50)} style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {categories.map((cat) => {
                  const meta = cat === "all" ? null : CategoryMeta[cat];
                  return (
                    <FilterChip
                      key={cat}
                      label={cat === "all" ? "All" : meta?.label ?? cat}
                      icon={meta?.icon}
                      active={selectedCategory === cat}
                      onPress={() => setSelectedCategory(cat)}
                    />
                  );
                })}
              </ScrollView>
            </Animated.View>

            {/* Date Range Filters */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.filterSection}>
              <Text style={styles.filterLabel}>Period</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                <FilterChip
                  label="All Time"
                  icon="📅"
                  active={dateRange === "all"}
                  onPress={() => setDateRange("all")}
                />
                <FilterChip
                  label="This Month"
                  icon="📆"
                  active={dateRange === "month"}
                  onPress={() => setDateRange("month")}
                />
                <FilterChip
                  label="Last 7 Days"
                  icon="📊"
                  active={dateRange === "week"}
                  onPress={() => setDateRange("week")}
                />
              </ScrollView>
            </Animated.View>

            {/* Export Button */}
            <Animated.View entering={FadeInDown.delay(150)} style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleExportCsv}
                activeOpacity={0.8}
                style={styles.exportBtn}
                disabled={exporting}
              >
                <Text style={styles.exportBtnIcon}>📤</Text>
                <Text style={styles.exportBtnText}>
                  {exporting ? "Exporting..." : "Export CSV"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* List or Empty State */}
            {sections.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyTitle}>
                  {search || selectedCategory !== "all" || dateRange !== "all"
                    ? "No matching expenses"
                    : "No expenses yet"}
                </Text>
                <Text style={styles.emptyDesc}>
                  {search || selectedCategory !== "all" || dateRange !== "all"
                    ? "Try adjusting your filters"
                    : "Add your first expense from the dashboard"}
                </Text>
              </View>
            ) : (
              <SectionList
                sections={sections}
                keyExtractor={(item) => String(item.id)}
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
                    <TouchableOpacity
                      style={styles.expenseItem}
                      onPress={() =>
                        router.push({
                          pathname: "/expense-detail",
                          params: { id: item.id },
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <ExpenseCard expense={item} />
                    </TouchableOpacity>
                  </Animated.View>
                )}
                ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                stickySectionHeadersEnabled={false}
              />
            )}
          </View>
        </View>

        {/* Pull-to-refresh managed via ScrollView prop on list */}
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
    paddingTop: Spacing.xl + Spacing.md,
    paddingBottom: Spacing.lg,
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
    gap: Spacing.sm,
  },

  heroTotalLabel: {
    fontSize: FontSize.body,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: FontWeight.medium,
  },

  heroTotalValue: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
    color: Colors.textInverse,
  },

  heroTotalEmoji: {
    fontSize: FontSize.largeIcon,
    marginTop: Spacing.sm,
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

  // ─── SEARCH ─────────────────────────────────────────────────

  searchRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  searchIcon: {
    fontSize: 14,
  },

  searchInput: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },

  searchClear: {
    fontSize: 12,
    color: Colors.textMuted,
  },

  // ─── FILTERS ────────────────────────────────────────────────

  filterSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },

  filterLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },

  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  // ─── ACTION ROW ──────────────────────────────────────────────

  actionRow: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.accent + "15",
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    paddingVertical: Spacing.md,
  },

  exportBtnIcon: {
    fontSize: 14,
  },

  exportBtnText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.accent,
  },

  // ─── FILTER CHIP ────────────────────────────────────────────

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },

  chipActive: {
    backgroundColor: Colors.accent + "20",
    borderColor: Colors.accent,
  },

  chipIcon: {
    fontSize: 12,
  },

  chipLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
  },

  chipLabelActive: {
    color: Colors.accent,
  },

  // ─── LIST CONTENT ───────────────────────────────────────────

  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },

  sectionDate: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
  },

  sectionTotal: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },

  expenseItem: {
    marginBottom: Spacing.sm,
  },

  // ─── EMPTY STATE ────────────────────────────────────────────

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },

  emptyIcon: {
    fontSize: 52,
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
  },
});