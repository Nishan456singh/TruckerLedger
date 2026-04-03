import ScreenBackground from "@/components/ScreenBackground";
import { getShadow } from "@/constants/shadowUtils";
import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
    TypographyScale,
} from "@/constants/theme";
import { getAllExpenses } from "@/lib/expenseService";
import type { Expense } from "@/lib/types";
import { router, useFocusEffect } from "expo-router";

import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

/* ---------------- TILE ---------------- */

const ReceiptTile = React.memo(({ expense }: { expense: Expense }) => {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/expense-detail",
          params: { id: expense.id },
        })
      }
      style={({ pressed }) => [
        styles.tile,
        pressed && styles.tilePressedState,
      ]}
    >
      <Image
        source={{ uri: expense.receipt_uri! }}
        style={styles.tileImage}
      />
    </Pressable>
  );
});

ReceiptTile.displayName = "ReceiptTile";

/* ---------------- SCREEN ---------------- */

export default function ReceiptsScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ---------- FILTER RECEIPTS ---------- */
  const receipts = useMemo(
    () => expenses.filter((item) => item.receipt_uri),
    [expenses]
  );

  /* ---------- LOAD ---------- */
  const loadReceipts = useCallback(async () => {
    try {
      setLoading(true);
      const all = await getAllExpenses();
      setExpenses(all);
    } catch (e) {
      console.error("Failed to load receipts:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReceipts();
    }, [loadReceipts])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReceipts();
    setRefreshing(false);
  }, [loadReceipts]);

  /* ---------------- RENDER ---------------- */

  if (loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={{ alignItems: "center" }}>
            <Text style={styles.title}>Receipt Gallery</Text>
            <Text style={styles.subtitle}>
              {receipts.length} receipts
            </Text>
          </View>

          <View style={{ width: 44 }} />
        </View>

        {/* EMPTY */}
        {receipts.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyTitle}>No Receipts Yet</Text>
            <Text style={styles.emptyText}>
              Scan receipts to build your gallery
            </Text>
          </View>
        ) : (
          <FlatList
            data={receipts}
            keyExtractor={(item) => String(item.id)}
            numColumns={3}
            renderItem={({ item }) => <ReceiptTile expense={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
              />
            }
            // Performance optimizations
            removeClippedSubviews={true}
            initialNumToRender={9}
            maxToRenderPerBatch={12}
            windowSize={10}
            updateCellsBatchingPeriod={50}
          />
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
}

/* ---------------- STYLES ---------------- */

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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    ...getShadow(Shadow.small),
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

  subtitle: {
    ...TypographyScale.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  grid: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  row: {
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },

  tile: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.card,
    ...getShadow(Shadow.card),
  },

  tilePressedState: {
    opacity: 0.75,
  },

  tileImage: {
    width: "100%",
    height: "100%",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },

  emptyIcon: {
    fontSize: FontSize.largeIcon,
  },

  emptyTitle: {
    ...TypographyScale.subtitle,
    color: Colors.textPrimary,
  },

  emptyText: {
    ...TypographyScale.small,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});