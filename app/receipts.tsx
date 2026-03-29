import ScreenBackground from "@/components/ScreenBackground";
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
      style={({ pressed }) => [
        styles.tile,
        pressed && styles.tilePressedState,
      ]}
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
          <Text style={styles.emptyTitle}>No Receipts Yet</Text>
          <Text style={styles.emptyText}>Scan receipts to see them here</Text>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    ...Shadow.small,
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
  grid: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  tile: {
    width: "32%",
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 0,
    backgroundColor: Colors.card,
    ...Shadow.card,
  },
  tilePressedState: {
    opacity: 0.75,
    ...Shadow.small,
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
  },
  emptyIcon: {
    fontSize: FontSize.largeIcon,
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
  },
});
