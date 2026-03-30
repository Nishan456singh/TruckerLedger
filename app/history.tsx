import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
} from "react-native-reanimated";

import BOLCard from "@/components/BOLCard";
import ExpenseCard from "@/components/ExpenseCard";
import HistoryFilterPills, { type FilterType } from "@/components/HistoryFilterPills";
import ScreenBackground from "@/components/ScreenBackground";
import SearchBar from "@/components/SearchBar";

import {
  BorderRadius,
  Colors,
  FontWeight,
  Spacing,
} from "@/constants/theme";

import { getBOLHistory } from "@/lib/bolService";
import { getAllExpenses } from "@/lib/expenseService";
import { formatCurrency } from "@/lib/formatUtils";
import type { BOLRecord, Expense } from "@/lib/types";

/* ================= TYPES ================= */

type HistoryItem =
  | { type: "expense"; id: number; date: string; data: Expense }
  | { type: "bol"; id: number; date: string; data: BOLRecord };

interface Section {
  title: string;
  data: HistoryItem[];
  total: number;
}

/* ================= HELPERS ================= */

function formatDateLabel(date: string) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0];

  if (date === today) return "Today";
  if (date === yesterday) return "Yesterday";

  return date;
}

function groupByDate(items: HistoryItem[]): Section[] {
  const map = new Map<string, HistoryItem[]>();

  items.forEach((item) => {
    const list = map.get(item.date) ?? [];
    list.push(item);
    map.set(item.date, list);
  });

  return Array.from(map.entries()).map(([date, items]) => ({
    title: date,
    data: items,
    total: items.reduce((sum, i) => {
      if (i.type === "expense") return sum + i.data.amount;
      if (i.type === "bol") return sum + (i.data.load_amount ?? 0);
      return sum;
    }, 0),
  }));
}

/* ================= MAIN ================= */

const AnimatedSectionList =
  Animated.createAnimatedComponent(SectionList<HistoryItem>);

export default function HistoryScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bols, setBols] = useState<BOLRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const scrollY = useSharedValue(0);

  /* LOAD DATA */

  const loadData = useCallback(async () => {
    try {
      const [exp, bol] = await Promise.all([
        getAllExpenses(),
        getBOLHistory(),
      ]);
      setExpenses(exp);
      setBols(bol);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  /* FILTER */

  const filteredItems = useMemo(() => {
    let items: HistoryItem[] = [];

    if (filterType !== "bols") {
      items.push(
        ...expenses.map((e) => ({
          type: "expense" as const,
          id: e.id,
          date: e.date,
          data: e,
        }))
      );
    }

    if (filterType !== "receipts") {
      items.push(
        ...bols.map((b) => ({
          type: "bol" as const,
          id: b.id,
          date: b.date,
          data: b,
        }))
      );
    }

    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, bols, filterType]);

  const sections = useMemo(() => groupByDate(filteredItems), [filteredItems]);

  const totalAmount = useMemo(() => {
    return filteredItems.reduce((sum, i) => {
      if (i.type === "expense") return sum + i.data.amount;
      if (i.type === "bol") return sum + (i.data.load_amount ?? 0);
      return sum;
    }, 0);
  }, [filteredItems]);

  /* ANIMATION */

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const heroStyle = useAnimatedStyle(() => {
    const height = interpolate(scrollY.value, [0, 150], [180, 100], "clamp");
    return { height };
  });

  /* LOADING */

  if (loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  /* UI */

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        {/* HERO */}
        <Animated.View style={[styles.heroWrapper, heroStyle]}>
          <LinearGradient
            colors={[Colors.accent, "#A01B3A"]}
            style={styles.hero}
          >
            <View style={styles.heroTop}>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.back}>✕</Text>
              </TouchableOpacity>

              <Text style={styles.heroTitle}>History</Text>
              <View style={{ width: 40 }} />
            </View>

            <Text style={styles.totalValue}>
              {formatCurrency(totalAmount)}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* LIST */}
        <AnimatedSectionList
          sections={sections}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.headerContent}>
              <SearchBar
                placeholder="Search..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              <View style={styles.filterWrapper}>
                <HistoryFilterPills
                  activeFilter={filterType}
                  onFilterChange={setFilterType}
                />
              </View>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionDate}>
                {formatDateLabel(section.title)}
              </Text>
              <Text style={styles.sectionTotal}>
                {formatCurrency(section.total)}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.item}>
              {item.type === "expense" ? (
                <ExpenseCard
                  expense={item.data}
                  onPress={() =>
                    router.push(`/expense-detail?id=${item.data.id}`)
                  }
                />
              ) : (
                <BOLCard
                  bol={item.data}
                  onPress={() =>
                    router.push(`/bol-detail?id=${item.data.id}`)
                  }
                />
              )}
            </View>
          )}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  heroWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  hero: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: Spacing.lg,
    justifyContent: "space-between",
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  back: {
    color: "#fff",
    fontSize: 22,
  },

  heroTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: FontWeight.bold,
  },

  totalValue: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 10,
  },

  content: {
    paddingTop: 200,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
    gap: Spacing.md,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  sectionDate: {
    fontWeight: FontWeight.bold,
    fontSize: 16,
  },

  sectionTotal: {
    color: Colors.accent,
    fontWeight: FontWeight.bold,
  },

  item: {
    marginBottom: Spacing.md,
  },
  headerContent: {
  marginBottom: Spacing.lg,
},

filterWrapper: {
  marginTop: Spacing.md,
  marginBottom: Spacing.lg, 
},
});