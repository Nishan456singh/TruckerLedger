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
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import BOLCard from "@/components/BOLCard";
import ExpenseCard from "@/components/ExpenseCard";
import HistoryFilterPills, { FilterType } from "@/components/HistoryFilterPills";
import ScreenBackground from "@/components/ScreenBackground";
import SearchBar from "@/components/SearchBar";

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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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
    const height = interpolate(scrollY.value, [0, 150], [200, 120], "clamp");
    return { height };
  });

  /* LOADING */

  if (loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" color="#6FA0C8" />
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  /* UI */

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>

          {/* HERO */}

          <Animated.View style={[styles.heroWrapper, heroStyle]}>
            <LinearGradient
              colors={["#05060A", "#0E1016", "#181A21"]}
              style={styles.hero}
            >
              <View style={styles.heroTop}>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.back}>✕</Text>
                </TouchableOpacity>

                <Text style={styles.heroTitle}>History</Text>

                <View style={{ width: 30 }} />
              </View>

              <Text style={styles.totalValue}>
                {formatCurrency(totalAmount)}
              </Text>

              <Text style={styles.totalLabel}>
                Total records value
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
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#6FA0C8"
              />
            }
            contentContainerStyle={styles.content}
            ListHeaderComponent={
              <View style={styles.headerContent}>

                <SearchBar
                  placeholder="Search expenses or loads..."
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
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({

  safe: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
  },

  heroWrapper: {
    zIndex: 10,
  },

  hero: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    fontSize: 20,
    fontWeight: "700",
  },

  totalValue: {
    fontSize: 38,
    fontWeight: "800",
    color: "#fff",
    marginTop: 16,
  },

  totalLabel: {
    color: "#9CA3AF",
    marginTop: 4,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },

  headerContent: {
    marginTop: 20,
    marginBottom: 10,
  },

  filterWrapper: {
    marginTop: 16,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 26,
    marginBottom: 8,
  },

  sectionDate: {
    color: "#E5E7EB",
    fontWeight: "700",
    fontSize: 16,
  },

  sectionTotal: {
    color: "#6FA0C8",
    fontWeight: "700",
  },

  item: {
    marginBottom: 14,
  },
});