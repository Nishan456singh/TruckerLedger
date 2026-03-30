import PremiumButton from "@/components/PremiumButton";
import ScreenBackground from "@/components/ScreenBackground";

import { getShadow } from "@/constants/shadowUtils";
import { BorderRadius, Colors, FontSize, FontWeight, Shadow, Spacing, TypographyScale } from "@/constants/theme";

import { addExpense, getDashboardStats } from "@/lib/expenseService";
import type { Category } from "@/lib/types";

import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import React, { useCallback, useEffect, useRef, useState } from "react";

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

/* ---------------- HELPERS ---------------- */

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

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
      } catch (e) {
        console.error(e);
      }
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
    } catch (err) {
      Alert.alert("Error", "Failed to save expense");
    } finally {
      setSaving(false);
    }
  }, [amount, category, note, date, saving]);

  const parsedAmount = parseAmount(amount);
  const projectedTotal = todayTotal + parsedAmount;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.container}>
            {/* HERO */}
            <LinearGradient
              colors={[Colors.primary, "#E8B107"]}
              style={styles.heroSection}
            >
              <View style={styles.heroTopBar}>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.heroBackText}>✕</Text>
                </TouchableOpacity>

                <Text style={styles.heroTitle}>Add Expense</Text>
                <View style={{ width: 40 }} />
              </View>

              <View style={styles.heroAmountCenter}>
                <Text style={styles.heroAmountLabel}>Amount</Text>

                <View style={styles.heroAmountDisplay}>
                  <Text style={styles.heroAmountCurrency}>$</Text>

                  <TextInput
                    ref={amountRef}
                    style={styles.heroAmountInput}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0"
                  />
                </View>

                {parsedAmount > 0 && (
                  <Text style={styles.heroProjectedTotal}>
                    Today: {formatCurrency(projectedTotal)}
                  </Text>
                )}
              </View>
            </LinearGradient>

            {/* CARD */}
            <View style={styles.card}>
              <ScrollView contentContainerStyle={styles.content}>
                {/* QUICK */}
                <Animated.View entering={FadeInDown}>
                  <Text style={styles.sectionTitle}>Quick Amounts</Text>

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
                <Animated.View entering={FadeInDown.delay(50)}>
                  <Text style={styles.sectionTitle}>Category</Text>

                  <View style={styles.categoryGrid}>
                    {CATEGORY_LIST.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryBtn,
                          category === cat && styles.categoryBtnActive,
                        ]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text style={styles.categoryIcon}>
                          {CATEGORY_EMOJIS[cat]}
                        </Text>
                        <Text
                          style={[
                            styles.categoryText,
                            category === cat && styles.categoryTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>

                {/* INPUTS */}
                <Animated.View entering={FadeInDown.delay(100)}>
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
                    multiline
                    placeholder="Note"
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
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  container: { flex: 1 },

  heroSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
  },

  heroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  heroBackText: {
    fontSize: 24,
  },

  heroTitle: {
    ...TypographyScale.title,
  },

  heroAmountCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  heroAmountDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },

  heroAmountLabel: {
    ...TypographyScale.body,
    marginBottom: Spacing.sm,
  },

  heroAmountCurrency: {
    ...TypographyScale.display,
  },

  heroAmountInput: {
    ...TypographyScale.display,
  },

  heroProjectedTotal: {
    marginTop: Spacing.sm,
  },

  card: {
    flex: 1,
    marginTop: -Spacing.xl,
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: "hidden",
    ...getShadow(Shadow.large),
  },

  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
    gap: Spacing.lg,
  },

  sectionTitle: {
    ...TypographyScale.subtitle,
    marginBottom: Spacing.md,
  },

  quickGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },

  quickBtn: {
    flex: 1,
    padding: Spacing.md,
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...getShadow(Shadow.small),
  },

  quickText: {
    ...TypographyScale.body,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },

  categoryBtn: {
    flex: 1,
    minWidth: "30%",
    padding: Spacing.md,
    alignItems: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...getShadow(Shadow.small),
  },

  categoryBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  categoryIcon: {
    fontSize: FontSize.body,
  },

  categoryText: {
    ...TypographyScale.small,
  },

  categoryTextActive: {
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
  },

  input: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },

  notes: {
    height: 100,
  },

  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },

  cancel: {
    textAlign: "center",
    marginTop: Spacing.md,
    color: Colors.textMuted,
  },
});