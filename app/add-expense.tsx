import PremiumButton from "@/components/PremiumButton";
import ScreenBackground from "@/components/ScreenBackground";

import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
    TypographyScale
} from "@/constants/theme";

import { addExpense, getDashboardStats } from "@/lib/expenseService";
import type { Category } from "@/lib/types";

import * as Haptics from "expo-haptics";

import { router } from "expo-router";

import React, { useEffect, useRef, useState } from "react";

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

import Animated, {
    FadeInDown,
    FadeInUp,
} from "react-native-reanimated";

import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

type Category_ = Category;

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const QUICK_AMOUNTS = [10, 25, 50, 100];
const CATEGORY_EMOJIS: Record<Category_, string> = {
  fuel: "⛽",
  food: "🍔",
  repair: "🔧",
  toll: "🛣️",
  parking: "🅿️",
  other: "📦",
};

export default function AddExpenseScreen() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category_>("fuel");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);

  const amountRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => amountRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    const loadTodayTotal = async () => {
      try {
        const stats = await getDashboardStats();
        setTodayTotal(stats.todayTotal);
      } catch (error) {
        console.error("Failed to load today total:", error);
      }
    };
    loadTodayTotal();
  }, []);

  async function handleSave() {
    const parsedAmount = Number(amount.replace(/[^\d.]/g, ""));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );

      Alert.alert("Invalid amount", "Please enter a valid expense amount.");
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

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      router.back();
    } catch (err) {
      console.error(err);

      const msg =
        err instanceof Error
          ? err.message
          : "Failed to save expense. Please try again.";

      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  }

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(String(quickAmount));
  };

  const parsedAmount = Number(amount.replace(/[^\d.]/g, "")) || 0;
  const projectedTotal = todayTotal + parsedAmount;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.container}>
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* HERO SECTION (50% - Yellow/Action themed)                      */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            <LinearGradient
              colors={[Colors.primary, '#E8B107']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroSection}
            >
              {/* Top Bar */}
              <View style={styles.heroTopBar}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.heroBackBtn}
                >
                  <Text style={styles.heroBackText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.heroTitle}>Add Expense</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Centered Amount Display */}
              <View style={styles.heroAmountCenter}>
                <Text style={styles.heroAmountLabel}>Amount</Text>
                <View style={styles.heroAmountDisplay}>
                  <Text style={styles.heroAmountCurrency}>$</Text>
                  <TextInput
                    ref={amountRef}
                    style={styles.heroAmountInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor="rgba(17, 17, 17, 0.2)"
                  />
                </View>
                {parsedAmount > 0 && (
                  <Text style={styles.heroProjectedTotal}>
                    Today's total: {formatCurrency(projectedTotal)}
                  </Text>
                )}
              </View>
            </LinearGradient>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* FLOATING CARD (50%+ - Form & Actions)                         */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            <View style={styles.floatingCardContainer}>
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.cardContent}
                >
                  {/* Quick Amounts */}
                  <Animated.View entering={FadeInDown}>
                    <Text style={styles.cardSectionTitle}>Quick Amounts</Text>
                    <View style={styles.quickAmountsGrid}>
                      {QUICK_AMOUNTS.map((qa) => (
                        <TouchableOpacity
                          key={qa}
                          style={styles.quickAmountBtn}
                          onPress={() => handleQuickAmount(qa)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.quickAmountText}>${qa}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Animated.View>

                  {/* Category Selection */}
                  <Animated.View entering={FadeInDown.delay(50)}>
                    <Text style={styles.cardSectionTitle}>Category</Text>
                    <View style={styles.categoryGrid}>
                      {(["fuel", "food", "repair", "toll", "parking", "other"] as Category_[]).map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryBtn,
                            category === cat && styles.categoryBtnActive,
                          ]}
                          onPress={() => setCategory(cat)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.categoryIcon}>{CATEGORY_EMOJIS[cat]}</Text>
                          <Text
                            style={[
                              styles.categoryLabel,
                              category === cat && styles.categoryLabelActive,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Animated.View>

                  {/* Date & Note */}
                  <Animated.View entering={FadeInDown.delay(100)}>
                    <Text style={styles.cardSectionTitle}>Details</Text>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Date</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={date}
                        onChangeText={setDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Note (optional)</Text>
                      <TextInput
                        style={[styles.fieldInput, styles.notesInput]}
                        value={note}
                        onChangeText={setNote}
                        placeholder="Vendor, description, etc."
                        placeholderTextColor={Colors.textMuted}
                        multiline
                      />
                    </View>
                  </Animated.View>

                  {/* Summary */}
                  {parsedAmount > 0 && (
                    <Animated.View entering={FadeInDown.delay(150)} style={styles.summarySection}>
                      <Text style={styles.summaryTitle}>Summary</Text>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Today's expenses</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(todayTotal)}</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>+ This expense</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(parsedAmount)}</Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, styles.summaryLabelBold]}>
                          New total
                        </Text>
                        <Text style={[styles.summaryValue, styles.summaryValueBold]}>
                          {formatCurrency(projectedTotal)}
                        </Text>
                      </View>
                    </Animated.View>
                  )}
                </ScrollView>
              </KeyboardAvoidingView>

              {/* Bottom Action Buttons */}
              <Animated.View entering={FadeInUp} style={styles.cardFooter}>
                <PremiumButton
                  label="💾 Save Expense"
                  onPress={handleSave}
                  loading={saving}
                  disabled={!amount || saving}
                  size="large"
                  fullWidth
                />
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },

  container: {
    flex: 1,
    position: "relative",
  },

  // ─── HERO SECTION ───────────────────────────────────────────

  heroSection: {
    flex: 0.5,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.md,
    justifyContent: "space-between",
  },

  heroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroBackBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  heroBackText: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  heroTitle: {
    ...TypographyScale.title,
    color: Colors.textPrimary,
  },

  heroAmountCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },

  heroAmountLabel: {
    ...TypographyScale.small,
    color: "rgba(17, 17, 17, 0.6)",
  },

  heroAmountDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },

  heroAmountCurrency: {
    ...TypographyScale.display,
    color: Colors.textPrimary,
  },

  heroAmountInput: {
    ...TypographyScale.display,
    color: Colors.textPrimary,
    minWidth: 150,
    textAlign: "center",
  },

  heroProjectedTotal: {
    ...TypographyScale.small,
    color: "rgba(17, 17, 17, 0.5)",
    marginTop: Spacing.md,
  },

  // ─── FLOATING CARD ──────────────────────────────────────────

  floatingCardContainer: {
    flex: 0.55,
    marginTop: -Spacing.lg,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    ...Shadow.large,
  },

  cardContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.lg,
  },

  cardSectionTitle: {
    ...TypographyScale.subtitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },

  // ─── QUICK AMOUNTS ──────────────────────────────────────────

  quickAmountsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    flexWrap: "wrap",
  },

  quickAmountBtn: {
    flex: 1,
    minWidth: "22%",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    ...Shadow.small,
  },

  quickAmountText: {
    ...TypographyScale.body,
    color: Colors.primary,
  },

  // ─── CATEGORY GRID ──────────────────────────────────────────

  categoryGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    flexWrap: "wrap",
  },

  categoryBtn: {
    flex: 1,
    minWidth: "31%",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadow.small,
  },

  categoryBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Shadow.medium,
  },

  categoryIcon: {
    fontSize: FontSize.statIcon,
  },

  categoryLabel: {
    ...TypographyScale.small,
    color: Colors.textMuted,
  },

  categoryLabelActive: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },

  // ─── FIELDS ─────────────────────────────────────────────────

  fieldGroup: {
    marginBottom: Spacing.lg,
  },

  fieldLabel: {
    ...TypographyScale.small,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },

  fieldInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    ...TypographyScale.body,
    color: Colors.textPrimary,
    ...Shadow.small,
  },

  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  // ─── SUMMARY ────────────────────────────────────────────────

  summarySection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },

  summaryTitle: {
    ...TypographyScale.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },

  summaryLabel: {
    ...TypographyScale.small,
    color: Colors.textMuted,
  },

  summaryLabelBold: {
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  summaryValue: {
    ...TypographyScale.body,
    color: Colors.textPrimary,
  },

  summaryValueBold: {
    ...TypographyScale.title,
    color: Colors.primary,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },

  // ─── FOOTER ─────────────────────────────────────────────────

  cardFooter: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  cancelBtn: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.small,
  },

  cancelBtnText: {
    ...TypographyScale.body,
    color: Colors.textMuted,
  },
});
