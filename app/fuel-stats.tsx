import HighContrastCard from "@/components/HighContrastCard";
import ScreenBackground from "@/components/ScreenBackground";
import {
    BorderRadius,
    Colors,
    FontWeight,
    Shadow,
    Spacing,
    TypographyScale
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
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
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

          <View style={[styles.row, styles.rowLast]}>
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
    padding: Spacing.lg,
    paddingBottom: 40,
    gap: Spacing.xl,
    marginTop: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
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
    ...TypographyScale.headline,
    color: Colors.textPrimary,
  },
  card: {
    gap: Spacing.lg,
    ...Shadow.card,
  },
  label: {
    ...TypographyScale.small,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    ...TypographyScale.body,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  calculateBtn: {
    backgroundColor: Colors.accent,
    minHeight: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  calculateBtnText: {
    ...TypographyScale.body,
    color: Colors.background,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rowLabel: {
    ...TypographyScale.small,
    color: Colors.textSecondary,
  },
  rowValue: {
    ...TypographyScale.subtitle,
    color: Colors.textPrimary,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
});
