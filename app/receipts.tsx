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
      <Image source={{ uri: expense.receipt_uri! }} style={styles.tileImage} />

      <View style={styles.tileOverlay} />
    </Pressable>
  );
});

ReceiptTile.displayName = "ReceiptTile";

/* ---------------- SCREEN ---------------- */

export default function ReceiptsScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const receipts = useMemo(
    () => expenses.filter((item) => item.receipt_uri),
    [expenses]
  );

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

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading receipts...</Text>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["top","left","right","bottom"]}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Receipt Gallery</Text>
            <Text style={styles.subtitle}>
              {receipts.length} scanned receipts
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
              Scan your first receipt to start tracking expenses
            </Text>
          </View>
        ) : (
          <FlatList
            data={receipts}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
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
            removeClippedSubviews
            initialNumToRender={8}
            maxToRenderPerBatch={12}
            windowSize={10}
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
  },

  /* HEADER */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  headerTextWrap: {
    alignItems: "center",
  },

  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(255,255,255,0.08)",
    ...getShadow(Shadow.small),
  },

  backText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: FontWeight.bold,
  },

  title: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    color: "#fff",
  },

  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },

  /* GRID */

  grid: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  row: {
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },

  tile: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: "#1B1F2A",
    ...getShadow(Shadow.card),
  },

  tilePressedState: {
    transform: [{ scale: 0.96 }],
  },

  tileImage: {
    width: "100%",
    height: "100%",
  },

  tileOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
  },

  /* LOADING */

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: Colors.textSecondary,
  },

  /* EMPTY */

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },

  emptyIcon: {
    fontSize: FontSize.largeIcon,
  },

  emptyTitle: {
    ...TypographyScale.subtitle,
    color: "#fff",
  },

  emptyText: {
    ...TypographyScale.small,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
});