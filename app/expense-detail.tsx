import CategorySelector from "@/components/CategorySelector";
import PrimaryButton from "@/components/PrimaryButton";
import ReceiptPreview from "@/components/ReceiptPreview";

import {
  BorderRadius,
  CategoryMeta,
  Colors,
  FontSize,
  FontWeight,
  Shadow,
  Spacing,
} from "@/constants/theme";

import type { Category, Expense } from "@/lib/types";

import {
  deleteExpense,
  getExpenseById,
  updateExpense,
} from "@/lib/expenseService";

import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { router, useLocalSearchParams } from "expo-router";

import React, { useEffect, useRef, useState } from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

import { SafeAreaView } from "react-native-safe-area-context";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(v);
}

function formatDateDisplay(iso: string): string {
  const today = todayISO();
  const yesterday = yesterdayISO();

  if (iso === today) return "Today";
  if (iso === yesterday) return "Yesterday";

  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ExpenseDetailScreen() {
  const params = useLocalSearchParams<{ id?: string; fromScan?: string }>();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [editing, setEditing] = useState(params.fromScan === "1");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  const [showReceiptFull, setShowReceiptFull] = useState(false);

  const amountRef = useRef<TextInput>(null);

  useEffect(() => {
    if (params.id) loadExpense(Number(params.id));
  }, [params.id]);

  useEffect(() => {
    if (editing) {
      setTimeout(() => amountRef.current?.focus(), 200);
    }
  }, [editing]);

  async function loadExpense(id: number) {
    const data = await getExpenseById(id);

    if (!data) {
      Alert.alert("Not found", "Expense could not be found.");
      router.back();
      return;
    }

    setExpense(data);
    setAmount(String(data.amount));
    setCategory(data.category);
    setDate(data.date);
    setNote(data.note ?? "");
    setReceiptUri(data.receipt_uri ?? null);
  }

  async function handleSave() {
    if (!expense) return;

    const parsedAmount = Number(amount.replace(/[^\d.]/g, ""));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      );

      Alert.alert("Invalid amount", "Please enter a valid amount.");
      return;
    }

    setSaving(true);

    try {
      await updateExpense(expense.id, {
        amount: parsedAmount,
        category,
        date,
        note: note.trim(),
        receipt_uri: receiptUri,
      });

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      await loadExpense(expense.id);

      setEditing(false);
    } catch {
      Alert.alert("Error", "Failed to update expense.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!expense) return;

    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);

            try {
              await deleteExpense(expense.id);

              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning
              );

              router.back();
            } catch {
              setDeleting(false);
              Alert.alert("Error", "Failed to delete expense.");
            }
          },
        },
      ]
    );
  }

  async function handlePickImage() {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission needed", "Photo access required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  }

  if (!expense) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.loadingText}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const meta =
    CategoryMeta[expense.category as Category] || CategoryMeta.other;

  const isScannedEntry = params.fromScan === "1" || !!expense.ocr_text;
  const detectedVendor = note.startsWith("Vendor:")
    ? note.replace("Vendor:", "").trim()
    : "";
  const editCategoryMeta = CategoryMeta[category] || CategoryMeta.other;

  if (!editing) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.viewContent}>
          <Animated.View entering={FadeInDown.springify()} style={styles.viewHeader}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.viewTitle}>Expense Detail</Text>

            <TouchableOpacity onPress={() => setEditing(true)}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.heroCard}>
            <View style={[styles.heroIcon, { backgroundColor: meta.color + "25" }]}>
              <Text style={styles.heroEmoji}>{meta.icon}</Text>
            </View>

            <Text style={styles.heroAmount}>
              {formatCurrency(expense.amount)}
            </Text>

            <Text style={[styles.heroCategory, { color: meta.color }]}>
              {meta.label}
            </Text>
          </Animated.View>

          {receiptUri && (
            <ReceiptPreview
              uri={receiptUri}
              onPress={() => setShowReceiptFull(true)}
            />
          )}

          <PrimaryButton
            label="Delete Expense"
            variant="danger"
            onPress={handleDelete}
            loading={deleting}
          />
        </ScrollView>

        {receiptUri && (
          <Modal visible={showReceiptFull} transparent animationType="fade">
            <View style={styles.modalBg}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowReceiptFull(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>

              <ReceiptPreview uri={receiptUri} />
            </View>
          </Modal>
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.editContent}>
          <Text style={styles.viewTitle}>Edit Expense</Text>

          {isScannedEntry && (
            <Animated.View entering={FadeIn.duration(220)} style={styles.detectedCard}>
              <Text style={styles.detectedTitle}>Detected fields</Text>
              <Text style={styles.detectedHint}>Review and edit before saving.</Text>

              <View style={styles.detectedRow}>
                <Text style={styles.detectedLabel}>Vendor</Text>
                <Text style={styles.detectedValue}>{detectedVendor || "-"}</Text>
              </View>

              <View style={styles.detectedRow}>
                <Text style={styles.detectedLabel}>Amount</Text>
                <Text style={styles.detectedValue}>
                  {Number(amount) > 0 ? formatCurrency(Number(amount)) : "-"}
                </Text>
              </View>

              <View style={styles.detectedRow}>
                <Text style={styles.detectedLabel}>Category</Text>
                <Text style={styles.detectedValue}>
                  {editCategoryMeta.icon} {editCategoryMeta.label}
                </Text>
              </View>

              <View style={styles.detectedRow}>
                <Text style={styles.detectedLabel}>Date</Text>
                <Text style={styles.detectedValue}>{formatDateDisplay(date)}</Text>
              </View>
            </Animated.View>
          )}

          <View style={styles.amountContainer}>
            <Text style={styles.currencySign}>$</Text>

            <TextInput
              ref={amountRef}
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          <CategorySelector selected={category} onChange={setCategory} />

          <TouchableOpacity onPress={handlePickImage}>
            <Text>📎 Attach Receipt</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label="Save Changes"
            onPress={handleSave}
            loading={saving}
            disabled={saving || Number(amount) <= 0}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  loadingText: { color: Colors.textSecondary },

  viewContent: { padding: Spacing.xl, gap: Spacing.lg },

  viewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backText: { fontSize: 28, color: Colors.textPrimary },

  viewTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  editBtnText: { color: Colors.primary },

  heroCard: {
    backgroundColor: Colors.card,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
  },

  heroIcon: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.xl,
  },

  heroEmoji: { fontSize: 32 },

  heroAmount: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.extrabold,
  },

  heroCategory: { fontSize: FontSize.body },

  modalBg: {
    flex: 1,
    backgroundColor: Colors.overlay,
    padding: Spacing.xl,
  },

  modalClose: {
    position: "absolute",
    top: 50,
    right: 20,
  },

  modalCloseText: { color: Colors.textPrimary, fontSize: 18 },

  editContent: { padding: Spacing.xl, gap: Spacing.lg },

  detectedCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.button,
  },

  detectedTitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  detectedHint: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },

  detectedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  detectedLabel: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },

  detectedValue: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },

  amountContainer: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },

  currencySign: { fontSize: FontSize.title },

  amountInput: { flex: 1, fontSize: FontSize.title },

  footer: { padding: Spacing.xl },
});