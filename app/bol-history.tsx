import HighContrastCard from "@/components/HighContrastCard";
import ScreenBackground from "@/components/ScreenBackground";
import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
    TypographyScale
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
    <ScreenBackground>
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
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
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading BOL history...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>📋</Text>
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

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>📍 To</Text>
                <Text style={styles.value}>{item.delivery_location || "-"}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Text style={styles.label}>🤝 Broker</Text>
                <Text style={styles.value}>{item.broker || "-"}</Text>
              </View>
            </HighContrastCard>
          ))}
        </ScrollView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
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
    ...TypographyScale.title,
    color: Colors.textPrimary,
  },
  searchWrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    ...Shadow.small,
  },
  searchIcon: {
    fontSize: FontSize.body,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    ...TypographyScale.body,
    paddingVertical: Spacing.md,
  },
  clearIcon: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  filterButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBtnText: {
    ...TypographyScale.small,
    color: Colors.textSecondary,
  },
  filterBtnTextActive: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingText: {
    ...TypographyScale.small,
    color: Colors.textSecondary,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    ...TypographyScale.subtitle,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  emptyText: {
    ...TypographyScale.small,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  resultCount: {
    ...TypographyScale.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: FontWeight.medium,
  },
  card: {
    gap: Spacing.md,
    ...Shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  cardDate: {
    ...TypographyScale.small,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  cardAmount: {
    ...TypographyScale.small,
    color: Colors.accent,
    fontWeight: FontWeight.bold,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderTiny,
    marginVertical: Spacing.xs,
  },
  label: {
    ...TypographyScale.small,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  value: {
    ...TypographyScale.small,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
});
