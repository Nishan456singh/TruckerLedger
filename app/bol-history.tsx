import HighContrastCard from "@/components/HighContrastCard";
import {
    Colors,
    FontSize,
    FontWeight,
    Spacing
} from "@/constants/theme";
import { getBOLHistory } from "@/lib/bolService";
import type { BOLRecord } from "@/lib/types";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
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

  const loadBols = useCallback(async () => {
    setLoading(true);

    try {
      const rows = await getBOLHistory();
      setItems(rows);
    } catch (error) {
      console.error("Failed to load BOL history:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBols();
    }, [loadBols])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>BOL History</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.loadingText}>Loading BOL history...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No BOL records yet</Text>
          <Text style={styles.emptyText}>Scan your first BOL to build load history.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {items.map((item) => (
            <HighContrastCard key={item.id} style={styles.card}>
              <Text style={styles.cardDate}>{item.date || "No date"}</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Pickup</Text>
                <Text style={styles.value}>{item.pickup_location || "-"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Delivery</Text>
                <Text style={styles.value}>{item.delivery_location || "-"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Broker</Text>
                <Text style={styles.value}>{item.broker || "-"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Load Amount</Text>
                <Text style={styles.value}>{formatCurrency(item.load_amount)}</Text>
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
  card: {
    gap: Spacing.xs,
  },
  cardDate: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    paddingVertical: 2,
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
