import HighContrastCard from "@/components/HighContrastCard";
import ScreenBackground from "@/components/ScreenBackground";
import { getShadow } from "@/constants/shadowUtils";
import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
    TypographyScale
} from "@/constants/theme";

import {
    getBOLHistory,
    getBOLsByBroker,
    getBOLsByLocation,
    searchBOLs,
} from "@/lib/bolService";

import type { BOLRecord } from "@/lib/types";

import { LinearGradient } from "expo-linear-gradient";
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
  }).format(value);
}

export default function BOLHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BOLRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "broker" | "location"
  >("all");

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
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.container}>
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* HERO SECTION (Blue - BOL themed)                              */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          <LinearGradient
            colors={[Colors.secondary, '#5A7FB0']}
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
              <Text style={styles.heroTitle}>BOL History</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Centered Title & Count Display */}
            <View style={styles.heroCenter}>
              <Text style={styles.heroCenterIcon}>📋</Text>
              <Text style={styles.heroCenterLabel}>
                {items.length} BOL{items.length !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.heroCenterSubtitle}>
                {searchQuery ? "Search Results" : "All Shipments"}
              </Text>
            </View>
          </LinearGradient>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* FLOATING CARD (Search, Filters, & Content)                    */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          <View style={styles.floatingCardContainer}>
            {/* SEARCH BAR */}
            <View style={styles.searchSection}>
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

              {/* FILTER PILLS */}
              {searchQuery && (
                <View style={styles.filterButtons}>
                  {["all", "broker", "location"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterBtn,
                        filterType === type && styles.filterBtnActive,
                      ]}
                      onPress={() => setFilterType(type as any)}
                    >
                      <Text
                        style={[
                          styles.filterBtnText,
                          filterType === type && styles.filterBtnTextActive,
                        ]}
                      >
                        {type.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* CONTENT */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? "No results found" : "No BOL records"}
                </Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentList}
              >
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: "/bol-detail",
                        params: { id: String(item.id) },
                      })
                    }
                  >
                    <HighContrastCard style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardDate}>{item.date}</Text>
                        <Text style={styles.cardAmount}>
                          {formatCurrency(item.load_amount)}
                        </Text>
                      </View>

                      <Text style={styles.cardLocation}>
                        📍 {item.pickup_location} → {item.delivery_location}
                      </Text>

                      <Text style={styles.cardBroker}>
                        🤝 {item.broker || "No broker"}
                      </Text>
                    </HighContrastCard>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
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

  // ─── HERO SECTION ───────────────────────────────────────────

  heroSection: {
    flex: 0.4,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl,
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
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  heroTitle: {
    ...TypographyScale.subtitle,
    color: Colors.textInverse,
  },

  heroCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },

  heroCenterIcon: {
    fontSize: FontSize.largeIcon,
  },

  heroCenterLabel: {
    ...TypographyScale.subtitle,
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },

  heroCenterSubtitle: {
    fontSize: FontSize.caption,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: FontWeight.medium,
    marginTop: Spacing.xs,
  },

  // ─── FLOATING CARD ──────────────────────────────────────────

  floatingCardContainer: {
    flex: 0.65,
    marginTop: -Spacing.xl,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    ...getShadow(Shadow.large),
  },

  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing.md,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    ...TypographyScale.body,
  },

  searchIcon: {
    fontSize: FontSize.body,
  },

  clearIcon: {
    color: Colors.textMuted,
    fontSize: FontSize.section,
    marginLeft: Spacing.sm,
  },

  filterButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },

  filterBtn: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },

  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  filterBtnText: {
    textAlign: "center",
    color: Colors.textMuted,
    ...TypographyScale.small,
    fontWeight: FontWeight.semibold,
  },

  filterBtnTextActive: {
    color: Colors.textInverse,
  },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxxl,
    gap: Spacing.md,
  },

  loadingText: {
    color: Colors.textMuted,
    ...TypographyScale.body,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxxl,
    gap: Spacing.md,
  },

  emptyIcon: {
    fontSize: FontSize.largeIcon,
  },

  emptyTitle: {
    color: Colors.textMuted,
    ...TypographyScale.body,
    fontWeight: FontWeight.semibold,
  },

  contentList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
    gap: Spacing.lg,
  },

  card: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...getShadow(Shadow.small),
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },

  cardDate: {
    color: Colors.textMuted,
    ...TypographyScale.small,
    fontWeight: FontWeight.semibold,
  },

  cardAmount: {
    color: Colors.primary,
    ...TypographyScale.subtitle,
    fontWeight: FontWeight.bold,
  },

  cardLocation: {
    color: Colors.textPrimary,
    ...TypographyScale.body,
    marginBottom: Spacing.sm,
  },

  cardBroker: {
    color: Colors.textMuted,
    ...TypographyScale.small,
  },
});