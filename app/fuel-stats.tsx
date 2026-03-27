import HighContrastCard from "@/components/HighContrastCard";
import ScreenBackground from "@/components/ScreenBackground";
import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Spacing,
} from "@/constants/theme";
import { getFuelStats } from "@/lib/fuelService";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function FuelStatsScreen() {
  const now = useMemo(() => new Date(), []);
  const [milesDriven, setMilesDriven] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    fuelThisMonth: 0,
    milesDriven: 0,
    fuelCostPerMile: 0,
    fuelCostPerTrip: 0,
    tripCount: 0,
  });

  async function handleCalculate() {
    const miles = Number(milesDriven.replace(/[^\d.]/g, ""));

    if (!Number.isFinite(miles) || miles <= 0) {
      Alert.alert("Miles required", "Enter miles driven to calculate fuel efficiency.");
      return;
    }

    setLoading(true);

    try {
      const result = await getFuelStats(miles, now.getMonth() + 1, now.getFullYear());
      setStats(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load fuel stats.";
      Alert.alert("Unable to calculate", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenBackground>
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Fuel Efficiency</Text>
          <View style={{ width: 36 }} />
        </View>

        <HighContrastCard style={styles.card}>
          <Text style={styles.label}>Miles Driven (This Month)</Text>
          <TextInput
            value={milesDriven}
            onChangeText={setMilesDriven}
            keyboardType="decimal-pad"
            placeholder="e.g. 7200"
            placeholderTextColor={Colors.textMuted}
            style={styles.input}
          />

          <Pressable
            onPress={handleCalculate}
            disabled={loading}
            style={({ pressed }) => [
              styles.calculateBtn,
              pressed && { opacity: 0.85 },
              loading && { opacity: 0.7 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textPrimary} />
            ) : (
              <Text style={styles.calculateBtnText}>Calculate</Text>
            )}
          </Pressable>
        </HighContrastCard>

        <HighContrastCard style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Fuel This Month</Text>
            <Text style={styles.rowValue}>{formatCurrency(stats.fuelThisMonth)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Miles Driven</Text>
            <Text style={styles.rowValue}>{stats.milesDriven.toLocaleString()}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Fuel Cost Per Mile</Text>
            <Text style={styles.rowValue}>{formatCurrency(stats.fuelCostPerMile)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Fuel Cost Per Trip</Text>
            <Text style={styles.rowValue}>{formatCurrency(stats.fuelCostPerTrip)}</Text>
          </View>
        </HighContrastCard>
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
  content: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  card: {
    gap: Spacing.sm,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
  },
  input: {
    backgroundColor: Colors.cardAlt,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    fontSize: FontSize.body,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  calculateBtn: {
    backgroundColor: Colors.accent,
    minHeight: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xs,
  },
  calculateBtnText: {
    color: Colors.background,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  rowLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
  },
  rowValue: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
});
