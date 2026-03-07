import ExpenseCard from '@/components/ExpenseCard';
import {
    BorderRadius,
    CategoryMeta,
    Colors,
    FontSize,
    FontWeight,
    Spacing,
    type Category
} from '@/constants/theme';
import { getAllExpenses } from '@/lib/expenseService';
import type { Expense } from '@/lib/types';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    RefreshControl,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Section {
  title: string;
  data: Expense[];
  total: number;
}

function groupByDate(expenses: Expense[]): Section[] {
  const map = new Map<string, Expense[]>();
  for (const e of expenses) {
    const existing = map.get(e.date) ?? [];
    existing.push(e);
    map.set(e.date, existing);
  }

  const sections: Section[] = [];
  for (const [date, items] of map.entries()) {
    const total = items.reduce((sum, i) => sum + i.amount, 0);
    sections.push({ title: date, data: items, total });
  }

  return sections.sort((a, b) => b.title.localeCompare(a.title));
}

function formatSectionDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
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
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ExpenseHistoryScreen() {
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
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

  // Filter
  const filtered = allExpenses.filter((e) => {
    const matchesCat = selectedCategory === 'all' || e.category === selectedCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      e.category.includes(q) ||
      (e.note ?? '').toLowerCase().includes(q) ||
      String(e.amount).includes(q);
    return matchesCat && matchesSearch;
  });

  const sections = groupByDate(filtered);
  const grandTotal = filtered.reduce((sum, e) => sum + e.amount, 0);

  const categories: (Category | 'all')[] = [
    'all',
    'fuel',
    'toll',
    'parking',
    'food',
    'repair',
    'other',
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Expense History</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>{formatCurrency(grandTotal)}</Text>
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
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Category filters */}
      <Animated.View entering={FadeInDown.delay(140).springify()}>
        <SectionList
          horizontal
          sections={[{ title: '', data: categories }]}
          renderItem={() => null}
          ListHeaderComponent={
            <View style={styles.filterRow}>
              {categories.map((cat) => {
                const meta = cat === 'all' ? null : CategoryMeta[cat];
                return (
                  <FilterChip
                    key={cat}
                    label={cat === 'all' ? 'All' : meta!.label}
                    icon={cat === 'all' ? undefined : meta!.icon}
                    active={selectedCategory === cat}
                    onPress={() => setSelectedCategory(cat)}
                  />
                );
              })}
            </View>
          }
          showsHorizontalScrollIndicator={false}
        />
      </Animated.View>

      {/* Expense list */}
      {sections.length === 0 ? (
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.empty}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>
            {search || selectedCategory !== 'all' ? 'No matching expenses' : 'No expenses yet'}
          </Text>
          <Text style={styles.emptyDesc}>
            {search || selectedCategory !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first expense from the dashboard'}
          </Text>
        </Animated.View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionDate}>{formatSectionDate(section.title)}</Text>
              <Text style={styles.sectionTotal}>{formatCurrency(section.total)}</Text>
            </View>
          )}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
              <ExpenseCard
                expense={item}
                onPress={() =>
                  router.push({
                    pathname: '/expense-detail',
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 28,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    lineHeight: 32,
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

  // Search
  searchRow: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: 0,
  },
  searchClear: {
    fontSize: 12,
    color: Colors.textMuted,
    padding: 2,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary + '20',
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

  // List
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionDate: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionTotal: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
  },

  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyIcon: {
    fontSize: 52,
  },
  emptyTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
