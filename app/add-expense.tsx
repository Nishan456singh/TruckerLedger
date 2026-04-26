import PremiumButton from "@/components/PremiumButton";
import ScreenBackground from "@/components/ScreenBackground";

import { BorderRadius, Spacing } from "@/constants/theme";

import { addExpense, getDashboardStats } from "@/lib/expenseService";
import { formatCurrency, parseAmount, todayISO } from "@/lib/formatUtils";
import type { Category } from "@/lib/types";

import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useCallback, useEffect, useRef, useState } from "react";

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

import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

/* ---------------- CONSTANTS ---------------- */

const QUICK_AMOUNTS = [10, 25, 50, 100] as const;

const CATEGORY_LIST: Category[] = [
  "fuel",
  "food",
  "repair",
  "toll",
  "parking",
  "other",
];

const CATEGORY_EMOJIS: Record<Category, string> = {
  fuel: "⛽",
  food: "🍔",
  repair: "🔧",
  toll: "🛣️",
  parking: "🅿️",
  other: "📦",
};

/* ---------------- SCREEN ---------------- */

export default function AddExpenseScreen() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("fuel");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);

  const amountRef = useRef<TextInput>(null);

  useEffect(() => {
    const timer = setTimeout(() => amountRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stats = await getDashboardStats();
        setTodayTotal(stats.todayTotal);
      } catch {}
    })();
  }, []);

  const handleQuickAmount = useCallback((value: number) => {
    setAmount(String(value));
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;

    const parsedAmount = parseAmount(amount);

    if (parsedAmount <= 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Invalid amount", "Enter a valid amount.");
      return;
    }

    setSaving(true);

    try {
      await addExpense({
        amount: parsedAmount,
        category,
        note: note.trim(),
        date,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.back();
    } catch {
      Alert.alert("Error", "Failed to save expense");
    } finally {
      setSaving(false);
    }
  }, [amount, category, note, date, saving]);

  const parsedAmount = parseAmount(amount);
  const projectedTotal = todayTotal + parsedAmount;

  return (
    <ScreenBackground>
      <LinearGradient
        colors={["#05060A", "#0E1016", "#181A21"]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {/* HERO */}

            <View style={styles.heroSection}>
              <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.close}>✕</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Add Expense</Text>

                <View style={{ width: 30 }} />
              </View>

              <View style={styles.amountCenter}>
                <Text style={styles.amountLabel}>Expense Amount</Text>

                <View style={styles.amountDisplay}>
                  <Text style={styles.currency}>$</Text>

                  <TextInput
                    ref={amountRef}
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>

                {parsedAmount > 0 && (
                  <Text style={styles.projected}>
                    Today total: {formatCurrency(projectedTotal)}
                  </Text>
                )}
              </View>
            </View>

            {/* CARD */}

            <View style={styles.card}>
              <ScrollView contentContainerStyle={styles.content}>
                {/* QUICK */}

                <Animated.View entering={FadeInDown}>
                  <Text style={styles.sectionTitle}>Quick Amount</Text>

                  <View style={styles.quickGrid}>
                    {QUICK_AMOUNTS.map((qa) => (
                      <TouchableOpacity
                        key={qa}
                        style={styles.quickBtn}
                        onPress={() => handleQuickAmount(qa)}
                      >
                        <Text style={styles.quickText}>${qa}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>

                {/* CATEGORY */}

                <Animated.View entering={FadeInDown.delay(80)}>
                  <Text style={styles.sectionTitle}>Category</Text>

                  <View style={styles.categoryGrid}>
                    {CATEGORY_LIST.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryBtn,
                          category === cat && styles.categoryActive,
                        ]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text style={styles.categoryIcon}>
                          {CATEGORY_EMOJIS[cat]}
                        </Text>

                        <Text style={styles.categoryText}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>

                {/* DETAILS */}

                <Animated.View entering={FadeInDown.delay(140)}>
                  <Text style={styles.sectionTitle}>Details</Text>

                  <TextInput
                    style={styles.input}
                    value={date}
                    onChangeText={setDate}
                  />

                  <TextInput
                    style={[styles.input, styles.notes]}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Add a note..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    multiline
                  />
                </Animated.View>
              </ScrollView>

              {/* FOOTER */}

              <Animated.View entering={FadeInUp} style={styles.footer}>
                <PremiumButton
                  label="Save Expense"
                  onPress={handleSave}
                  loading={saving}
                  disabled={!parsedAmount}
                />

                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.cancel}>Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </ScreenBackground>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safe: {
    flex: 1,
  },

  heroSection: {
    paddingTop: 40,
    paddingHorizontal: Spacing.lg,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  close: {
    fontSize: 24,
    color: "#fff",
  },

  title: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "700",
  },

  amountCenter: {
    alignItems: "center",
    marginTop: 40,
  },

  amountLabel: {
    color: "rgba(255,255,255,0.6)",
    marginBottom: 12,
  },

  amountDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },

  currency: {
    fontSize: 42,
    color: "#fff",
    marginRight: 4,
  },

  amountInput: {
    fontSize: 42,
    fontWeight: "700",
    color: "#fff",
  },

  projected: {
    marginTop: 10,
    color: "rgba(255,255,255,0.6)",
  },

  card: {
    flex: 1,
    marginTop: 40,
    backgroundColor: "rgba(20,22,28,0.95)",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },

  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },

  quickGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },

  quickBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },

  quickText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },

  categoryBtn: {
    width: "30%",
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },

  categoryActive: {
    backgroundColor: "#3B82F6",
  },

  categoryIcon: {
    fontSize: 22,
  },

  categoryText: {
    color: "#fff",
    marginTop: 6,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 14,
    borderRadius: BorderRadius.md,
    color: "#fff",
    marginBottom: 10,
  },

  notes: {
    height: 90,
  },

  footer: {
    padding: Spacing.lg,
  },

  cancel: {
    textAlign: "center",
    marginTop: 12,
    color: "rgba(255,255,255,0.5)",
  },
});