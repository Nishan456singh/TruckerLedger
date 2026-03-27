import PrimaryButton from "@/components/PrimaryButton";

import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Spacing
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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.formTitle}>💰 Add Expense</Text>
              <View style={{ width: 20 }} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(50)}>
            <View style={styles.amountContainer}>
              <Text style={styles.currencySign}>$</Text>
              <TextInput
                ref={amountRef}
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100)}>
            <Text style={styles.fieldLabel}>Quick amounts</Text>
            <View style={styles.quickAmounts}>
              {QUICK_AMOUNTS.map((qa) => (
                <TouchableOpacity
                  key={qa}
                  style={styles.quickAmountBtn}
                  onPress={() => handleQuickAmount(qa)}
                >
                  <Text style={styles.quickAmountText}>${qa}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150)}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {(["fuel", "food", "repair", "toll", "parking", "other"] as Category_[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={styles.categoryEmoji}>{CATEGORY_EMOJIS[cat]}</Text>
                  <Text style={[styles.categoryLabel, category === cat && styles.categoryLabelActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.dateInput}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textMuted}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250)}>
            <Text style={styles.fieldLabel}>Note</Text>
            <TextInput
              style={styles.notesInput}
              value={note}
              onChangeText={setNote}
              placeholder="Optional note (vendor, description, etc.)"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300)} style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Today's total</Text>
              <Text style={styles.summaryValue}>{formatCurrency(todayTotal)}</Text>
            </View>
            {parsedAmount > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>+ This expense</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(parsedAmount)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { fontWeight: FontWeight.bold }]}>New total</Text>
                  <Text style={[styles.summaryValue, { color: Colors.accent, fontWeight: FontWeight.bold }]}>
                    {formatCurrency(projectedTotal)}
                  </Text>
                </View>
              </>
            )}
          </Animated.View>
        </ScrollView>

        <Animated.View entering={FadeInUp} style={styles.footer}>
          <PrimaryButton
            label="💾 Save Expense"
            onPress={handleSave}
            loading={saving}
            disabled={!amount || saving}
            size="lg"
          />
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollContent: {
    padding: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },

  closeBtnText: {
    fontSize: 18,
    color: Colors.textSecondary,
  },

  formTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  currencySign: {
    fontSize: 36,
    color: Colors.background,
    fontWeight: FontWeight.extrabold,
  },

  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: FontWeight.extrabold,
    color: Colors.background,
  },

  fieldLabel: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },

  quickAmounts: {
    flexDirection: "row",
    gap: Spacing.md,
    flexWrap: "wrap",
    marginBottom: Spacing.lg,
  },

  quickAmountBtn: {
    flex: 1,
    minWidth: "22%",
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.card,
  },

  quickAmountText: {
    fontSize: FontSize.body + 1,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },

  categoryGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
    marginBottom: Spacing.md,
  },

  categoryBtn: {
    flex: 1,
    minWidth: "31%",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.card,
  },

  categoryBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  categoryEmoji: {
    fontSize: 20,
  },

  categoryLabel: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },

  categoryLabelActive: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },

  dateInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    marginBottom: Spacing.md,
  },

  notesInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 80,
    color: Colors.textPrimary,
    fontSize: FontSize.body,
  },

  summaryCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },

  summaryLabel: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },

  summaryValue: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },

  footer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xl * 2,
    gap: Spacing.md,
  },

  cancelBtn: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },

  cancelBtnText: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },
});
