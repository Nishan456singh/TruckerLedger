import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Spacing,
} from "@/constants/theme";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

function parseAmount(value: string): number {
  if (!value.trim()) return 0;

  const normalized = value.replace(/,/g, "");
  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function InputRow({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputBox}>
        <Text style={styles.dollar}>$</Text>
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
  const [food, setFood] = useState("");
  const [tolls, setTolls] = useState("");
  const [parking, setParking] = useState("");
  const [profitResult, setProfitResult] = useState<number | null>(null);

  const incomeValue = parseAmount(income);
  const fuelValue = parseAmount(fuel);
  const foodValue = parseAmount(food);
  const tollsValue = parseAmount(tolls);
  const parkingValue = parseAmount(parking);

  const totalExpenses = useMemo(
    () => fuelValue + foodValue + tollsValue + parkingValue,
    [fuelValue, foodValue, tollsValue, parkingValue]
  );

  function handleCalculate() {
    const value = incomeValue - totalExpenses;
    setProfitResult(value);
  }

  const hasInput =
    income.length > 0 ||
    fuel.length > 0 ||
    food.length > 0 ||
    tolls.length > 0 ||
    parking.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View entering={FadeInDown.springify()} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Trip Profit Calculator</Text>
            <Text style={styles.subtitle}>Income - Expenses</Text>
          </View>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <InputRow label="Trip Income" value={income} onChangeText={setIncome} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(130).springify()}>
            <InputRow label="Fuel Cost" value={fuel} onChangeText={setFuel} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).springify()}>
            <InputRow label="Food Cost" value={food} onChangeText={setFood} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(230).springify()}>
            <InputRow label="Tolls" value={tolls} onChangeText={setTolls} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(260).springify()}>
            <InputRow
              label="Parking"
              value={parking}
              onChangeText={setParking}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(290).springify()}>
            <Pressable
              onPress={handleCalculate}
              style={({ pressed }) => [
                styles.calculateBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.calculateBtnText}>Calculate</Text>
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(330).springify()}
            style={styles.resultCard}
          >
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Total Expenses</Text>
              <Text style={styles.resultValue}>{formatCurrency(totalExpenses)}</Text>
            </View>

            <View style={styles.resultDivider} />

            <View style={styles.resultRow}>
              <Text style={styles.profitLabel}>Profit</Text>
              <Text
                style={[
                  styles.profitValue,
                  {
                    color:
                      profitResult === null || profitResult >= 0
                        ? Colors.accent
                        : Colors.danger,
                  },
                ]}
              >
                {hasInput && profitResult !== null
                  ? formatCurrency(profitResult)
                  : "$0.00"}
              </Text>
            </View>
          </Animated.View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
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
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.section,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  subtitle: {
    marginTop: 2,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  inputWrap: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  inputBox: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  dollar: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md + 2,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },
  resultCard: {
    marginTop: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  calculateBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
  },
  calculateBtnText: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultLabel: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  resultValue: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  resultDivider: {
    marginVertical: Spacing.md,
    height: 1,
    backgroundColor: Colors.border,
  },
  profitLabel: {
    fontSize: FontSize.section - 2,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  profitValue: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.extrabold,
  },
});
