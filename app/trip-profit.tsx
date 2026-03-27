import HighContrastCard from "@/components/HighContrastCard";
import PrimaryButton from "@/components/PrimaryButton";
import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Spacing,
} from "@/constants/theme";
import { calculateTripProfit, createTrip } from "@/lib/tripService";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function parseAmount(value: string): number {
  if (!value.trim()) return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function Field({
  label,
  value,
  onChangeText,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  icon?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.labelRow}>
        {icon && <Text style={styles.fieldIcon}>{icon}</Text>}
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <View style={styles.inputWrap}>
        <Text style={styles.inputPrefix}>$</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
        />
      </View>
    </View>
  );
}

export default function TripProfitScreen() {
  const [income, setIncome] = useState("");
  const [fuel, setFuel] = useState("");
  const [tolls, setTolls] = useState("");
  const [food, setFood] = useState("");
  const [parking, setParking] = useState("");
  const [repairs, setRepairs] = useState("");
  const [otherExpenses, setOtherExpenses] = useState("");
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(
    () => ({
      income: parseAmount(income),
      fuel: parseAmount(fuel),
      tolls: parseAmount(tolls),
      food: parseAmount(food),
      parking: parseAmount(parking),
      repairs: parseAmount(repairs),
      other_expenses: parseAmount(otherExpenses),
    }),
    [income, fuel, tolls, food, parking, repairs, otherExpenses]
  );

  const { totalExpenses, profit } = useMemo(
    () => calculateTripProfit(parsed),
    [parsed]
  );

  async function handleSaveTrip() {
    if (parsed.income <= 0) {
      Alert.alert("Income required", "Enter load income before saving the trip.");
      return;
    }

    setSaving(true);

    try {
      await createTrip({
        ...parsed,
        date: new Date().toISOString().split("T")[0],
      });

      Alert.alert("Trip saved", "Trip profit has been saved locally.");
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save trip.";
      Alert.alert("Save failed", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.title}>🚚 Trip Profit</Text>
            <View style={{ width: 36 }} />
          </View>

          <Text style={styles.sectionLabel}>Trip Expenses</Text>

          <Field label="Load Income" value={income} onChangeText={setIncome} icon="💰" />
          <Field label="Fuel" value={fuel} onChangeText={setFuel} icon="⛽" />
          <Field label="Tolls" value={tolls} onChangeText={setTolls} icon="🛣️" />
          <Field label="Food" value={food} onChangeText={setFood} icon="🍔" />
          <Field label="Parking" value={parking} onChangeText={setParking} icon="🅿️" />
          <Field label="Repairs" value={repairs} onChangeText={setRepairs} icon="🔧" />
          <Field
            label="Other Expenses"
            value={otherExpenses}
            onChangeText={setOtherExpenses}
            icon="📦"
          />

          <HighContrastCard style={styles.resultCard}>
            <Text style={styles.resultTitle}>📊 Trip Summary</Text>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Income</Text>
              <Text style={[styles.resultValue, { color: Colors.primary }]}>{formatCurrency(parsed.income)}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Total Expenses</Text>
              <Text style={[styles.resultValue, { color: Colors.danger }]}>{formatCurrency(totalExpenses)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.resultRow}>
              <Text style={styles.profitLabel}>Net Profit</Text>
              <Text
                style={[
                  styles.profitValue,
                  { color: profit >= 0 ? Colors.primary : Colors.danger },
                ]}
              >
                {formatCurrency(profit)}
              </Text>
            </View>
          </HighContrastCard>

          <PrimaryButton
            label="💾 Save Trip"
            onPress={handleSaveTrip}
            loading={saving}
            disabled={saving}
            size="lg"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
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
  fieldWrap: {
    gap: Spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
  },
  fieldIcon: {
    fontSize: 16,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  inputPrefix: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    paddingVertical: Spacing.md,
    fontWeight: FontWeight.semibold,
  },
  resultCard: {
    marginTop: Spacing.lg,
    gap: Spacing.lg,
  },
  resultTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultLabel: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },
  resultValue: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  profitLabel: {
    fontSize: FontSize.section + 2,
    color: Colors.textPrimary,
    fontWeight: FontWeight.extrabold,
  },
  profitValue: {
    fontSize: FontSize.section + 4,
    fontWeight: FontWeight.extrabold,
  },
});
