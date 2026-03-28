import CategorySelector from "@/components/CategorySelector";
import PrimaryButton from "@/components/PrimaryButton";
import ReceiptPreview from "@/components/ReceiptPreview";
import ScreenBackground from "@/components/ScreenBackground";

import {
    BorderRadius,
    CategoryMeta,
    Colors,
    FontSize,
    FontWeight,
    Spacing
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

import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

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
    weekday: "long",
    month: "long",
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
      <ScreenBackground>
        <SafeAreaView style={styles.center}>
          <Text style={styles.loadingText}>Loading…</Text>
        </SafeAreaView>
      </ScreenBackground>
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
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
          <View style={styles.container}>
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* HERO SECTION (50% - Category-color themed)                     */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            <LinearGradient
              colors={[meta.color, meta.color + "CC"]}
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
                <Text style={styles.heroTitle}>Expense Details</Text>
                <TouchableOpacity onPress={() => setEditing(true)}>
                  <Text style={styles.heroEditText}>Edit</Text>
                </TouchableOpacity>
              </View>

              {/* Centered Amount Display */}
              <View style={styles.heroAmountCenter}>
                <Text style={styles.heroAmountValue}>
                  {formatCurrency(expense.amount)}
                </Text>
                <Text style={styles.heroAmountEmoji}>{meta.icon}</Text>
              </View>

              {/* Category Pill */}
              <View style={styles.heroCategoryPill}>
                <Text style={styles.heroCategoryLabel}>{meta.label}</Text>
              </View>
            </LinearGradient>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* FLOATING CARD (50%+ - Details & Actions)                       */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            <View style={styles.floatingCardContainer}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.cardContent}
              >
                {/* Details Section */}
                <Animated.View entering={FadeInDown}>
                  <Text style={styles.cardSectionTitle}>📋 Details</Text>
                  <View style={styles.detailsBlock}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date</Text>
                      <Text style={styles.detailValue}>{formatDateDisplay(expense.date)}</Text>
                    </View>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Category</Text>
                      <Text style={styles.detailValue}>{meta.icon} {meta.label}</Text>
                    </View>
                    {expense.note && (
                      <>
                        <View style={styles.detailDivider} />
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Note</Text>
                          <Text style={[styles.detailValue, { maxWidth: "50%", textAlign: "right" }]}>
                            {expense.note}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </Animated.View>

                {/* Receipt Preview */}
                {receiptUri && (
                  <Animated.View entering={FadeInDown.delay(50)}>
                    <Text style={[styles.cardSectionTitle, { marginTop: Spacing.lg }]}>
                      📸 Receipt
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowReceiptFull(true)}
                      activeOpacity={0.8}
                    >
                      <ReceiptPreview uri={receiptUri} />
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </ScrollView>

              {/* Delete Button */}
              <Animated.View entering={FadeInDown.delay(100)} style={styles.cardFooter}>
                <PrimaryButton
                  label="🗑️ Delete Expense"
                  variant="danger"
                  onPress={handleDelete}
                  loading={deleting}
                  fullWidth
                />
              </Animated.View>
            </View>
          </View>

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
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.container}>
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* HERO SECTION (40% - Category-themed for context)              */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            <LinearGradient
              colors={[meta.color, meta.color + "CC"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.editHeroSection}
            >
              {/* Top Bar */}
              <View style={styles.editHeroTopBar}>
                <TouchableOpacity
                  onPress={() => setEditing(false)}
                  style={styles.editHeroBackBtn}
                >
                  <Text style={styles.editHeroBackText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.editHeroTitle}>Edit Expense</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Category indicator */}
              <View style={styles.editHeroCategoryRow}>
                <Text style={styles.editHeroIcon}>{editCategoryMeta.icon}</Text>
                <Text style={styles.editHeroCategoryName}>{editCategoryMeta.label}</Text>
              </View>
            </LinearGradient>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* FLOATING CARD (60%+ - Edit Form)                              */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            <View style={styles.editFloatingCardContainer}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.editCardContent}
              >
                {/* Amount Input */}
                <Animated.View entering={FadeInDown}>
                  <View style={styles.amountContainer}>
                    <Text style={styles.currencySign}>$</Text>
                    <TextInput
                      ref={amountRef}
                      style={styles.amountInput}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </Animated.View>

                {/* Category Selector */}
                <Animated.View entering={FadeInDown.delay(50)}>
                  <Text style={styles.editSectionTitle}>📁 Category</Text>
                  <CategorySelector selected={category} onChange={setCategory} />
                </Animated.View>

                {/* Date & Note Fields */}
                <Animated.View entering={FadeInDown.delay(100)} style={styles.fieldsBlock}>
                  <View>
                    <Text style={styles.editFieldLabel}>📅 Date</Text>
                    <TextInput
                      style={styles.editInput}
                      value={date}
                      onChangeText={setDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>

                  <View>
                    <Text style={styles.editFieldLabel}>📝 Note (Optional)</Text>
                    <TextInput
                      style={[styles.editInput, { height: 80, paddingTop: Spacing.xl, textAlignVertical: "top" }]}
                      value={note}
                      onChangeText={setNote}
                      placeholder="Add notes about this expense"
                      placeholderTextColor={Colors.textMuted}
                      multiline
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handlePickImage}
                    style={styles.attachReceiptBtn}
                  >
                    <Text style={styles.attachReceiptIcon}>📎</Text>
                    <View style={styles.attachReceiptText}>
                      <Text style={styles.attachReceiptLabel}>Attach Receipt</Text>
                      <Text style={styles.attachReceiptStatus}>
                        {receiptUri ? "✓ Receipt attached" : "Optional"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </ScrollView>

              {/* Footer with Save/Cancel */}
              <Animated.View entering={FadeInDown.delay(150)} style={styles.editCardFooter}>
                <PrimaryButton
                  label="💾 Save Changes"
                  onPress={handleSave}
                  loading={saving}
                  disabled={saving || Number(amount) <= 0}
                  fullWidth
                />
                <TouchableOpacity
                  style={styles.editCancelBtn}
                  onPress={() => setEditing(false)}
                >
                  <Text style={styles.editCancelBtnText}>Cancel</Text>
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
  safe: { flex: 1, backgroundColor: "transparent" },

  container: {
    flex: 1,
    position: "relative",
  },

  // ─── VIEW MODE: HERO SECTION ─────────────────────────────────────────

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
    color: Colors.textInverse,
  },

  heroTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  heroEditText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },

  heroAmountCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },

  heroAmountValue: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.extrabold,
    color: Colors.textInverse,
  },

  heroAmountEmoji: {
    fontSize: FontSize.largeIcon,
    marginTop: Spacing.sm,
  },

  heroCategoryPill: {
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  heroCategoryLabel: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },

  // ─── VIEW MODE: FLOATING CARD ────────────────────────────────────────

  floatingCardContainer: {
    flex: 0.55,
    marginTop: -Spacing.lg,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: 32,
    overflow: "hidden",
    ...{
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 10,
    },
  },

  cardContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.lg,
  },

  cardSectionTitle: {
    fontSize: FontSize.subsection,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  detailsBlock: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: 0,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },

  detailLabel: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  detailValue: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },

  detailDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },

  modalBg: {
    flex: 1,
    backgroundColor: Colors.overlay,
    padding: Spacing.xl,
  },

  modalClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 100,
  },

  modalCloseText: { color: Colors.textPrimary, fontSize: 18 },

  cardFooter: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  // ─── EDIT MODE: HERO SECTION ─────────────────────────────────────────

  editHeroSection: {
    flex: 0.35,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.md,
    justifyContent: "space-between",
  },

  editHeroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  editHeroBackBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  editHeroBackText: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  editHeroTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  editHeroCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  editHeroIcon: {
    fontSize: FontSize.largeIcon,
  },

  editHeroCategoryName: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },

  // ─── EDIT MODE: FLOATING CARD ────────────────────────────────────────

  editFloatingCardContainer: {
    flex: 0.65,
    marginTop: -Spacing.lg,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: 32,
    overflow: "hidden",
    ...{
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 10,
    },
  },

  editCardContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.lg,
  },

  editSectionTitle: {
    fontSize: FontSize.subsection,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  currencySign: { fontSize: FontSize.title, color: Colors.textMuted },

  amountInput: {
    flex: 1,
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    paddingVertical: Spacing.lg,
  },

  fieldsBlock: {
    gap: Spacing.lg,
  },

  editFieldLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },

  editInput: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },

  attachReceiptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border + "30",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  attachReceiptIcon: {
    fontSize: 24,
  },

  attachReceiptText: {
    flex: 1,
  },

  attachReceiptLabel: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },

  attachReceiptStatus: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },

  editCardFooter: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  editCancelBtn: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  editCancelBtnText: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
  },
});