import CategorySelector from "@/components/CategorySelector";
import ImageViewerModal from "@/components/ImageViewerModal";
import PrimaryButton from "@/components/PrimaryButton";
import ReceiptPreview from "@/components/ReceiptPreview";
import ScreenBackground from "@/components/ScreenBackground";

import { getShadow } from "@/constants/shadowUtils";
import {
  BorderRadius,
  CategoryMeta,
  Colors,
  FontSize,
  FontWeight,
  Shadow,
  Spacing,
  TypographyScale,
} from "@/constants/theme";

import {
  deleteExpense,
  getExpenseById,
  updateExpense,
} from "@/lib/expenseService";
import type { Category, Expense } from "@/lib/types";

import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { router, useLocalSearchParams } from "expo-router";

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

import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

/* HELPERS */

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(v);
}

/* SCREEN */

export default function ExpenseDetailScreen() {
  const params = useLocalSearchParams<{ id?: string; fromScan?: string }>();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [editing, setEditing] = useState(params.fromScan === "1");

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [viewerUri, setViewerUri] = useState<string | null>(null);

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
    if (!data) return router.back();

    setExpense(data);
    setAmount(String(data.amount));
    setCategory(data.category);
    setDate(data.date);
    setNote(data.note ?? "");
    setReceiptUri(data.receipt_uri ?? null);
  }

  async function handleSave() {
    if (!expense) return;

    const parsed = Number(amount.replace(/[^\d.]/g, ""));
    if (!parsed || parsed <= 0) {
      Alert.alert("Invalid amount");
      return;
    }

    setSaving(true);

    try {
      await updateExpense(expense.id, {
        amount: parsed,
        category,
        date,
        note,
        receipt_uri: receiptUri,
      });

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      setEditing(false);
      loadExpense(expense.id);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!expense) return;

    Alert.alert("Delete Expense", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          await deleteExpense(expense.id);
          router.back();
        },
      },
    ]);
  }

  async function handlePickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // ✅ FIXED (no deprecated API)
      quality: 0.8,
    });

    if (!res.canceled) {
      setReceiptUri(res.assets[0].uri);
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

  const meta = CategoryMeta[category];

  /* ================= VIEW MODE ================= */

  if (!editing) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
          <View style={styles.container}>
            {/* HERO */}
            <LinearGradient
              colors={[meta.color, meta.color + "CC"]}
              style={styles.hero}
            >
              <View style={styles.topBar}>
                <Text style={styles.close} onPress={() => router.back()}>
                  ✕
                </Text>

                <Text style={styles.title}>Expense</Text>

                <Text style={styles.edit} onPress={() => setEditing(true)}>
                  Edit
                </Text>
              </View>

              <Text style={styles.amount}>
                {formatCurrency(Number(amount))}
              </Text>

              <Text style={styles.category}>
                {meta.icon} {meta.label}
              </Text>
            </LinearGradient>

            {/* CARD */}
            <View style={styles.card}>
              <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.section}>Details</Text>

                <View style={styles.block}>
                  <Row label="Date" value={date} />
                  <Divider />
                  <Row label="Note" value={note || "-"} />
                </View>

                {receiptUri && (
                  <>
                    <Text style={styles.section}>Receipt</Text>
                    <TouchableOpacity
                      onPress={() => setViewerUri(receiptUri)}
                    >
                      <ReceiptPreview uri={receiptUri} />
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>

              <PrimaryButton
                label="Delete Expense"
                variant="accent"
                onPress={handleDelete}
                loading={deleting}
              />
            </View>
          </View>

          <ImageViewerModal
            visible={!!viewerUri}
            uri={viewerUri}
            onClose={() => setViewerUri(null)}
          />
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  /* ================= EDIT MODE ================= */

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.container}>
            <LinearGradient
              colors={[meta.color, meta.color + "CC"]}
              style={styles.hero}
            >
              <Text style={styles.close} onPress={() => setEditing(false)}>
                ✕
              </Text>

              <Text style={styles.title}>Edit Expense</Text>
            </LinearGradient>

            <View style={styles.card}>
              <ScrollView contentContainerStyle={styles.content}>
                {/* AMOUNT */}
                <View style={styles.amountWrap}>
                  <Text style={styles.dollar}>$</Text>
                  <TextInput
                    ref={amountRef}
                    value={amount}
                    onChangeText={setAmount}
                    style={styles.inputBig}
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* CATEGORY */}
                <CategorySelector
                  selected={category}
                  onChange={setCategory}
                />

                {/* DATE */}
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  style={styles.input}
                />

                {/* NOTE */}
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  style={[styles.input, { height: 80 }]}
                  multiline
                />

                {/* SAVE */}
                <PrimaryButton
                  label="Save Changes"
                  onPress={handleSave}
                  loading={saving}
                />

                {/* ATTACH */}
                <TouchableOpacity onPress={handlePickImage}>
                  <Text style={styles.link}>Attach Receipt</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

/* COMPONENTS */

function Row({ label, value }: any) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const Divider = () => <View style={styles.divider} />;

/* STYLES */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  loadingText: {
    ...TypographyScale.body,
    color: Colors.textMuted,
  },

  hero: {
    paddingTop: 70,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 50,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  close: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },

  edit: {
    color: "#fff",
    fontWeight: "600",
  },

  title: {
    color: "#fff",
    fontSize: FontSize.section,
    fontWeight: "700",
    marginTop: Spacing.sm,
  },

  amount: {
    fontSize: 42,
    color: "#fff",
    fontWeight: "800",
    marginTop: Spacing.lg,
  },

  category: {
    color: "#fff",
    marginTop: Spacing.sm,
    fontSize: FontSize.body,
  },

  card: {
    flex: 1,
    marginTop: -Spacing.xl,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...getShadow(Shadow.large),
  },

  content: {
    gap: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  section: {
    ...TypographyScale.subtitle,
    color: Colors.textPrimary,
  },

  block: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...getShadow(Shadow.small),
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  label: {
    color: Colors.textMuted,
  },

  value: {
    color: Colors.textPrimary,
    fontWeight: "600",
    maxWidth: "55%",
    textAlign: "right",
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },

  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    ...getShadow(Shadow.small),
    marginBottom: Spacing.md,
  },

  dollar: {
    fontSize: 28,
    color: Colors.textMuted,
  },

  inputBig: {
    flex: 1,
    fontSize: 40,
    fontWeight: "800",
    color: Colors.textPrimary,
    paddingVertical: Spacing.lg,
  },

  input: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },

  link: {
    textAlign: "center",
    color: Colors.primary,
    marginTop: Spacing.lg,
    fontWeight: FontWeight.semibold,
  },
});