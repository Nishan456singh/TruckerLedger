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
import { formatCurrency, todayISO } from "@/lib/formatUtils";
import type { Category, Expense } from "@/lib/types";

import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";

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

/* ================= SCREEN ================= */

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
      mediaTypes: ["images"],
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
          <Text style={styles.loading}>Loading…</Text>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  const meta = CategoryMeta[category];

  /* ================= VIEW MODE ================= */

  if (!editing) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={["top","left","right","bottom"]}>
          <View style={styles.container}>

            {/* HERO */}
            <LinearGradient
              colors={["#0D0F14", "#1B1F2A"]}
              style={styles.hero}
            >
              <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.close}>‹</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Expense</Text>

                <TouchableOpacity onPress={() => setEditing(true)}>
                  <Text style={styles.edit}>Edit</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.amount}>
                {formatCurrency(Number(amount))}
              </Text>

              <Text style={styles.category}>
                {meta.icon} {meta.label}
              </Text>
            </LinearGradient>

            {/* GLASS CARD */}
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
                    <TouchableOpacity onPress={() => setViewerUri(receiptUri)}>
                      <ReceiptPreview uri={receiptUri} />
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>

              <PrimaryButton
                label="Delete Expense"
                variant="danger"
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
      <SafeAreaView style={styles.safe} edges={["top","left","right","bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.container}>

            <LinearGradient
              colors={["#0D0F14", "#1B1F2A"]}
              style={styles.hero}
            >
              <Text style={styles.close} onPress={() => setEditing(false)}>
                ✕
              </Text>

              <Text style={styles.title}>Edit Expense</Text>
            </LinearGradient>

            <View style={styles.card}>
              <ScrollView contentContainerStyle={styles.content}>

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

                <CategorySelector
                  selected={category}
                  onChange={setCategory}
                />

                <TextInput value={date} onChangeText={setDate} style={styles.input} />

                <TextInput
                  value={note}
                  onChangeText={setNote}
                  style={[styles.input, { height: 90 }]}
                  multiline
                />

                <PrimaryButton
                  label="Save Changes"
                  onPress={handleSave}
                  loading={saving}
                />

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

/* ================= COMPONENTS ================= */

function Row({ label, value }: any) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const Divider = () => <View style={styles.divider} />;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  container: { flex: 1 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  loading: {
    color: Colors.textMuted,
    fontSize: 16,
  },

  /* HERO */

  hero: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  close: {
    color: "#fff",
    fontSize: 26,
  },

  edit: {
    color: "#ccc",
    fontWeight: "600",
  },

  title: {
    color: "#fff",
    fontSize: FontSize.section,
    fontWeight: "700",
  },

  amount: {
    fontSize: 44,
    color: "#fff",
    fontWeight: "800",
    marginTop: Spacing.lg,
  },

  category: {
    color: "#aaa",
    marginTop: Spacing.sm,
  },

  /* CARD */

  card: {
    flex: 1,
    marginTop: -Spacing.xl,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    ...getShadow(Shadow.large),
  },

  content: {
    gap: Spacing.lg,
  },

  section: {
    color: "#fff",
    fontWeight: "600",
  },

  block: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  label: {
    color: "#888",
  },

  value: {
    color: "#fff",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: Spacing.sm,
  },

  /* INPUT */

  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
  },

  dollar: {
    fontSize: 28,
    color: "#aaa",
  },

  inputBig: {
    flex: 1,
    fontSize: 42,
    fontWeight: "800",
    color: "#fff",
    paddingVertical: Spacing.lg,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    color: "#fff",
  },

  link: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: Spacing.lg,
    fontWeight: FontWeight.semibold,
  },
});