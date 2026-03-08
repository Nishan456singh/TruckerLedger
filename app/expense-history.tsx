import ExpenseCard from "@/components/ExpenseCard";

import {
  BorderRadius,
  CategoryMeta,
  Colors,
  FontSize,
  FontWeight,
  Spacing,
} from "@/constants/theme";

import type { Category, Expense } from "@/lib/types";

import { getAllExpenses } from "@/lib/expenseService";

import { router, useFocusEffect } from "expo-router";

import React, { useCallback, useState } from "react";

import {
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";

import Animated, { FadeInDown } from "react-native-reanimated";

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

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(v);
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
  const [refreshing, setRefreshing] = useState(false);

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

  const filtered = allExpenses.filter((e) => {
    const matchesCategory =
      selectedCategory === "all" || e.category === selectedCategory;

    const q = search.toLowerCase();

    const matchesSearch =
      !q ||
      e.category.toLowerCase().includes(q) ||
      (e.note ?? "").toLowerCase().includes(q) ||
      String(e.amount).includes(q);

    return matchesCategory && matchesSearch;
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
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Expense History</Text>

        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>
            {formatCurrency(grandTotal)}
          </Text>
        </View>
      </Animated.View>

      {/* Search */}
      <Animated.View
        entering={FadeInDown.delay(80).springify()}
        style={styles.searchRow}
      >
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

      {/* Filters */}
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

      {/* List */}
      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>

          <Text style={styles.emptyTitle}>
            {search || selectedCategory !== "all"
              ? "No matching expenses"
              : "No expenses yet"}
          </Text>

          <Text style={styles.emptyDesc}>
            {search || selectedCategory !== "all"
              ? "Try adjusting your filters"
              : "Add your first expense from the dashboard"}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionDate}>
                {formatSectionDate(section.title)}
              </Text>

              <Text style={styles.sectionTotal}>
                {formatCurrency(section.total)}
              </Text>
            </View>
          )}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40)}>
              <ExpenseCard
                expense={item}
                onPress={() =>
                  router.push({
                    pathname: "/expense-detail",
                    params: { id: item.id },
                  })
                }
              />
            </Animated.View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
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
    flex: 1,
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  totalBadge: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  totalBadgeText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.accent,
  },

  searchRow: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
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

  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },

  chipActive: {
    backgroundColor: Colors.primary + "20",
    borderColor: Colors.primary,
  },

  chipIcon: {
    fontSize: 12,
  },

  chipLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },

  chipLabelActive: {
    color: Colors.primary,
  },

  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
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
    color: Colors.textSecondary,
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    color: Colors.textSecondary,
    textAlign: "center",
  },
});