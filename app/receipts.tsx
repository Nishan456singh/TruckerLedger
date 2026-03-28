import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Spacing,
} from "@/constants/theme";
import { getAllExpenses } from "@/lib/expenseService";
import ScreenBackground from "@/components/ScreenBackground";
import type { Expense } from "@/lib/types";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    FlatList, Image, Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ReceiptTile({ expense }: { expense: Expense }) {
  if (!expense.receipt_uri) return null;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/expense-detail",
          params: { id: expense.id },
        })
      }
      style={({ pressed }) => [styles.tile, pressed && { opacity: 0.8 }]}
    >
      <Image
        source={{ uri: expense.receipt_uri }}
        style={styles.tileImage}
        resizeMode="cover"
      />
    </Pressable>
  );
}

export default function ReceiptsScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const receipts = useMemo(
    () => expenses.filter((item) => !!item.receipt_uri),
    [expenses]
  );

  const loadReceipts = useCallback(async () => {
    const all = await getAllExpenses();
    setExpenses(all);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReceipts();
    }, [loadReceipts])
  );

  return (
    <ScreenBackground>
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Receipt Gallery</Text>
        <View style={{ width: 36 }} />
      </View>

      {receipts.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyTitle}>No receipts yet</Text>
          <Text style={styles.emptyText}>Scan receipts to see them here.</Text>
        </View>
      ) : (
        <FlatList
          data={receipts}
          keyExtractor={(item) => String(item.id)}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => <ReceiptTile expense={item} />}
        />
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
  grid: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  tile: {
    width: "32%",
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  emptyIcon: {
    fontSize: 44,
  },
  emptyTitle: {
    fontSize: FontSize.section,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  emptyText: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },
});
