import HighContrastCard from "@/components/HighContrastCard";
import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Spacing
} from "@/constants/theme";
import { getBOLHistory, getBOLsByBroker, getBOLsByLocation, searchBOLs } from "@/lib/bolService";
import type { BOLRecord } from "@/lib/types";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatCurrency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "-";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function BOLHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BOLRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "broker" | "location">("all");

  const loadBols = useCallback(async () => {
    setLoading(true);

    try {
      if (!searchQuery.trim()) {
        const rows = await getBOLHistory();
        setItems(rows);
      } else {
        let rows: BOLRecord[] = [];
        if (filterType === "broker") {
          rows = await getBOLsByBroker(searchQuery);
        } else if (filterType === "location") {
          rows = await getBOLsByLocation(searchQuery);
        } else {
          rows = await searchBOLs(searchQuery);
        }
        setItems(rows);
      }
    } catch (error) {
      console.error("Failed to load BOL history:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterType]);

  useFocusEffect(
    useCallback(() => {
      loadBols();
    }, [loadBols])
  );

  const handleClearSearch = () => {
    setSearchQuery("");
    setFilterType("all");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>BOL History</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search BOLs..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={handleClearSearch}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {searchQuery && (
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterBtn, filterType === "all" && styles.filterBtnActive]}
              onPress={() => setFilterType("all")}
            >
              <Text style={[styles.filterBtnText, filterType === "all" && styles.filterBtnTextActive]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, filterType === "broker" && styles.filterBtnActive]}
              onPress={() => setFilterType("broker")}
            >
              <Text style={[styles.filterBtnText, filterType === "broker" && styles.filterBtnTextActive]}>Broker</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, filterType === "location" && styles.filterBtnActive]}
              onPress={() => setFilterType("location")}
            >
              <Text style={[styles.filterBtnText, filterType === "location" && styles.filterBtnTextActive]}>Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Loading BOL history...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>{searchQuery ? "No results found" : "No BOL records yet"}</Text>
          <Text style={styles.emptyText}>{searchQuery ? "Try different search terms" : "Scan your first BOL to build load history."}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.resultCount}>{items.length} BOL{items.length !== 1 ? "s" : ""} found</Text>
          {items.map((item) => (
            <HighContrastCard key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>{item.date || "No date"}</Text>
                <Text style={styles.cardAmount}>{formatCurrency(item.load_amount)}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>📍 From</Text>
                <Text style={styles.value}>{item.pickup_location || "-"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>📍 To</Text>
                <Text style={styles.value}>{item.delivery_location || "-"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>🤝 Broker</Text>
                <Text style={styles.value}>{item.broker || "-"}</Text>
              </View>
            </HighContrastCard>
          ))}
        </ScrollView>
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
    justifyContent: "space-between",
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
  title: {
    fontSize: FontSize.section,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  searchWrap: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    fontSize: FontSize.body,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    paddingVertical: Spacing.md,
  },
  clearIcon: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
  },
  filterButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
  },
  filterBtnTextActive: {
    color: Colors.textPrimary,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
    textAlign: "center",
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  resultCount: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
    marginBottom: Spacing.sm,
  },
  card: {
    gap: Spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardDate: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
  cardAmount: {
    color: Colors.accent,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
});
