import PremiumButton from "@/components/PremiumButton";
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

import { formatCurrency, parseAmount } from "@/lib/formatUtils";
import { calculateTripProfit, createTrip } from "@/lib/tripService";

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { useMemo, useState } from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

/* ───────── SCREEN ───────── */

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
      Alert.alert("Enter income first");
      return;
    }

    setSaving(true);

    try {
      await createTrip({
        ...parsed,
        date: new Date().toISOString().split("T")[0],
      });

      Alert.alert("Saved");
      router.back();
    } finally {
      setSaving(false);
    }
  }

  const profitPositive = profit >= 0;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.container}>

            {/* HERO */}
            <LinearGradient
              colors={["#0B0D12", "#1A1E28"]}
              style={styles.hero}
            >
              <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.back}>‹</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Trip Profit</Text>

                <View style={{ width: 30 }} />
              </View>

              <Text style={styles.heroLabel}>Net Profit</Text>

              <Text
                style={[
                  styles.heroValue,
                  { color: profitPositive ? "#3EE58A" : "#FF5A5A" },
                ]}
              >
                {formatCurrency(profit)}
              </Text>

              <Text style={styles.heroHint}>
                {profitPositive ? "Profitable trip ✓" : "Needs adjustment ⚠"}
              </Text>

              <View style={styles.metrics}>
                <Metric label="Income" value={formatCurrency(parsed.income)} />
                <Metric label="Expenses" value={formatCurrency(totalExpenses)} />
              </View>
            </LinearGradient>

            {/* CARD */}
            <View style={styles.card}>
              <ScrollView contentContainerStyle={styles.content}>

                {/* INCOME */}
                <Animated.View entering={FadeInDown}>
                  <Text style={styles.section}>Income</Text>
                  <Input value={income} onChange={setIncome} />
                </Animated.View>

                {/* EXPENSES */}
                <Animated.View entering={FadeInDown.delay(80)}>
                  <Text style={styles.section}>Expenses</Text>

                  <Input value={fuel} onChange={setFuel} label="⛽ Fuel" />
                  <Input value={tolls} onChange={setTolls} label="🛣️ Tolls" />
                  <Input value={food} onChange={setFood} label="🍔 Food" />
                  <Input value={parking} onChange={setParking} label="🅿️ Parking" />
                  <Input value={repairs} onChange={setRepairs} label="🔧 Repairs" />
                  <Input value={otherExpenses} onChange={setOtherExpenses} label="📦 Other" />
                </Animated.View>

                {/* SUMMARY */}
                {parsed.income > 0 && (
                  <Animated.View entering={FadeInDown.delay(120)} style={styles.summary}>
                    <Row label="Income" value={parsed.income} />
                    <Row label="Expenses" value={totalExpenses} />
                    <Row label="Profit" value={profit} highlight />
                  </Animated.View>
                )}

              </ScrollView>

              {/* FOOTER */}
              <Animated.View entering={FadeInUp} style={styles.footer}>
                <PremiumButton
                  label="Save Trip"
                  onPress={handleSaveTrip}
                  loading={saving}
                />

                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.cancel}>Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

/* ───────── COMPONENTS ───────── */

function Metric({ label, value }: any) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Input({ value, onChange, label }: any) {
  return (
    <View style={styles.inputBlock}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={styles.inputWrap}>
        <Text style={styles.dollar}>$</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#666"
          style={styles.input}
        />
      </View>
    </View>
  );
}

function Row({ label, value, highlight }: any) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          highlight && { color: value >= 0 ? "#3EE58A" : "#FF5A5A" },
        ]}
      >
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

/* ───────── STYLES ───────── */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  container: { flex: 1 },

  hero: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  back: { color: "#fff", fontSize: 26 },

  title: { color: "#fff", fontWeight: "600" },

  heroLabel: { color: "#aaa", marginTop: 20 },

  heroValue: {
    fontSize: 42,
    fontWeight: "800",
    marginTop: 10,
  },

  heroHint: {
    color: "#888",
    marginTop: 8,
  },

  metrics: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },

  metric: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 12,
  },

  metricLabel: { color: "#888", fontSize: 12 },

  metricValue: { color: "#fff", fontWeight: "600" },

  card: {
    flex: 1,
    marginTop: -30,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },

  content: { gap: 20 },

  section: {
    color: "#fff",
    fontWeight: "600",
  },

  inputBlock: { gap: 6 },

  inputLabel: { color: "#aaa" },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    paddingHorizontal: 12,
  },

  dollar: { color: "#666" },

  input: {
    flex: 1,
    color: "#fff",
    paddingVertical: 10,
  },

  summary: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  rowLabel: { color: "#aaa" },

  rowValue: { color: "#fff", fontWeight: "600" },

  footer: {
    marginTop: 10,
    gap: 10,
  },

  cancel: {
    textAlign: "center",
    color: "#888",
  },
});