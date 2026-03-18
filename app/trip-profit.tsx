import HighContrastCard from "@/components/HighContrastCard";
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
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
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
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
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

            <Text style={styles.title}>Trip Profit</Text>
            <View style={{ width: 36 }} />
          </View>

          <Field label="Load Income" value={income} onChangeText={setIncome} />
          <Field label="Fuel" value={fuel} onChangeText={setFuel} />
          <Field label="Tolls" value={tolls} onChangeText={setTolls} />
          <Field label="Food" value={food} onChangeText={setFood} />
          <Field label="Parking" value={parking} onChangeText={setParking} />
          <Field label="Repairs" value={repairs} onChangeText={setRepairs} />
          <Field
            label="Other Expenses"
            value={otherExpenses}
            onChangeText={setOtherExpenses}
          />

          <HighContrastCard style={styles.resultCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Income</Text>
              <Text style={styles.resultValue}>{formatCurrency(parsed.income)}</Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Expenses</Text>
              <Text style={styles.resultValue}>{formatCurrency(totalExpenses)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.resultRow}>
              <Text style={styles.profitLabel}>Profit</Text>
              <Text
                style={[
                  styles.profitValue,
                  { color: profit >= 0 ? Colors.accent : Colors.danger },
                ]}
              >
                {formatCurrency(profit)}
              </Text>
            </View>
          </HighContrastCard>

          <Pressable
            onPress={handleSaveTrip}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && { opacity: 0.85 },
              saving && { opacity: 0.7 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color={Colors.textPrimary} />
            ) : (
              <Text style={styles.saveBtnText}>Save Trip</Text>
            )}
          </Pressable>
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
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
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
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
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
    marginTop: Spacing.sm,
    gap: Spacing.sm,
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
    marginVertical: Spacing.xs,
  },
  profitLabel: {
    fontSize: FontSize.section,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  profitValue: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.extrabold,
  },
  saveBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    minHeight: 58,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: Colors.background,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
});
