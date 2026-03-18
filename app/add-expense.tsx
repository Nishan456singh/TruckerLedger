import CategorySelector from "@/components/CategorySelector";
import PrimaryButton from "@/components/PrimaryButton";
import ReceiptPreview from "@/components/ReceiptPreview";

import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Spacing
} from "@/constants/theme";

import { parseReceiptWithAI } from "@/lib/ai/receiptAI";
import { addExpense } from "@/lib/expenseService";
import { extractTextFromImage } from "@/lib/receipt/ocrService";
import { parseReceiptText, shouldUseAiFallback } from "@/lib/receipt/receiptParser";
import type { Category } from "@/lib/types";

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

import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
} from "react-native-reanimated";

import { SafeAreaView } from "react-native-safe-area-context";

type ScreenMode = "pick" | "manual";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function formatDateDisplay(isoDate: string): string {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AddExpenseScreen() {
  const params = useLocalSearchParams<{
    mode?: string;
    category?: string;
    receiptUri?: string;
  }>();

  const initialCategory: Category =
    params.category === "fuel" ||
      params.category === "toll" ||
      params.category === "parking" ||
      params.category === "food" ||
      params.category === "repair" ||
      params.category === "other"
      ? (params.category as Category)
      : "fuel";

  const [mode, setMode] = useState<ScreenMode>(
    params.mode === "manual" ? "manual" : "pick"
  );

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>(initialCategory);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [didProcessReceipt, setDidProcessReceipt] = useState(false);

  const amountRef = useRef<TextInput>(null);

  useEffect(() => {
    if (mode === "manual") {
      setTimeout(() => amountRef.current?.focus(), 300);
    }
  }, [mode]);

  useEffect(() => {
    const scannedUri =
      typeof params.receiptUri === "string" ? params.receiptUri : "";

    if (!scannedUri || didProcessReceipt) {
      return;
    }

    let cancelled = false;

    const runPipeline = async () => {
      try {
        setMode("manual");
        setReceiptUri(scannedUri);

        console.log("OCR: Starting text extraction from", scannedUri);
        const ocr = await extractTextFromImage(scannedUri);
        const ocrText = ocr.text;

        console.log("OCR: Engine", ocr.engine, "Text length:", ocrText.length, "Reason:", ocr.reason);

        if (!ocrText.trim()) {
          if (!cancelled) {
            Alert.alert(
              "Could not read text",
              ocr.engine === "none"
                ? "OCR engine is not available in this runtime. Use a development build to enable receipt OCR, or continue manual entry."
                : "Receipt photo captured, but no readable text was detected. You can still fill the expense manually."
            );
          }
          return;
        }

        console.log("OCR: Extracted text preview:", ocrText.substring(0, 200));

        const parserResult = parseReceiptText(ocrText);
        console.log("Receipt Parser: Local result", parserResult);

        let finalResult = parserResult;

        if (shouldUseAiFallback(parserResult)) {
          console.log("Receipt Parser: Using AI fallback due to missing fields");
          const aiResult = await parseReceiptWithAI(ocrText);

          console.log("Receipt AI: Result", aiResult);

          if (aiResult) {
            finalResult = {
              amount: aiResult.amount ?? parserResult.amount,
              date: aiResult.date ?? parserResult.date,
              vendor: aiResult.vendor ?? parserResult.vendor,
              category: aiResult.category ?? parserResult.category,
            };
            console.log("Receipt AI: Merged result", finalResult);
          }

          if (!aiResult && !cancelled) {
            Alert.alert(
              "Low confidence scan",
              "Some receipt details could not be auto-filled. Please review and complete the fields manually."
            );
          }
        }

        if (cancelled) return;

        console.log("Receipt: Final result to autofill", finalResult);

        if (finalResult.amount !== null) {
          console.log("Setting amount:", finalResult.amount);
          setAmount(String(finalResult.amount));
        }

        if (finalResult.category) {
          console.log("Setting category:", finalResult.category);
          setCategory(finalResult.category as Category);
        }

        if (finalResult.date) {
          console.log("Setting date:", finalResult.date);
          setDate(finalResult.date);
        }

        if (finalResult.vendor) {
          console.log("Setting note with vendor:", finalResult.vendor);
          setNote(`Vendor: ${finalResult.vendor}`);
        }
      } catch (error) {
        console.error("Receipt processing failed:", error);
      } finally {
        if (!cancelled) {
          setDidProcessReceipt(true);
        }
      }
    };

    runPipeline();

    return () => {
      cancelled = true;
    };
  }, [didProcessReceipt, params.receiptUri]);

  // ─── Pick image ─────────────────────────

  async function handlePickImage() {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Photo library access is required to attach receipts."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets?.[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  }

  // ─── Save expense ───────────────────────

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
        receipt_uri: receiptUri,
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

  // ─── Pick mode screen ───────────────────

  if (mode === "pick") {
    return (
      <SafeAreaView style={styles.safe}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.pickContainer}>
          <View style={styles.pickHeader}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.pickTitle}>Add Expense</Text>

            <View style={{ width: 20 }} />
          </View>

          <Text style={styles.pickSubtitle}>
            How would you like to add this expense?
          </Text>

          <Animated.View entering={FadeInDown.delay(100)}>
            <TouchableOpacity
              style={styles.pickCard}
              onPress={() => router.push("/scan-receipt")}
            >
              <Text style={styles.pickIcon}>📷</Text>
              <Text style={styles.pickCardTitle}>Scan Receipt</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)}>
            <TouchableOpacity
              style={styles.pickCard}
              onPress={() => setMode("manual")}
            >
              <Text style={styles.pickIcon}>✏️</Text>
              <Text style={styles.pickCardTitle}>Add Manually</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ─── Manual form ────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.xl, gap: Spacing.lg }}
        >
          <Animated.View entering={FadeInDown}>
            <Text style={styles.formTitle}>New Expense</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100)}>
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

          <Animated.View entering={FadeInDown.delay(200)}>
            <CategorySelector selected={category} onChange={setCategory} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(260)}>
            <Text style={styles.fieldLabel}>Date</Text>

            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.datePill, date === todayISO() && styles.datePillActive]}
                onPress={() => setDate(todayISO())}
              >
                <Text style={[styles.datePillText, date === todayISO() && styles.datePillTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.datePill, date === yesterdayISO() && styles.datePillActive]}
                onPress={() => setDate(yesterdayISO())}
              >
                <Text style={[styles.datePillText, date === yesterdayISO() && styles.datePillTextActive]}>
                  Yesterday
                </Text>
              </TouchableOpacity>

              <View style={styles.dateDisplayPill}>
                <Text style={styles.datePillText}>{formatDateDisplay(date)}</Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(320)}>
            <Text style={styles.fieldLabel}>Notes</Text>

            <TextInput
              style={styles.notesInput}
              value={note}
              onChangeText={setNote}
              placeholder="Optional note"
              placeholderTextColor={Colors.textMuted}
              multiline
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(380)}>
            {receiptUri ? (
              <ReceiptPreview uri={receiptUri} onRemove={() => setReceiptUri(null)} />
            ) : (
              <TouchableOpacity style={styles.attachReceiptBtn} onPress={handlePickImage}>
                <Text>📎 Attach Receipt</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>

        <Animated.View entering={FadeInUp} style={styles.footer}>
          <PrimaryButton
            label="Save Expense"
            onPress={handleSave}
            loading={saving}
            disabled={!amount || saving}
          />
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

  pickContainer: {
    flex: 1,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },

  pickHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  pickTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  pickSubtitle: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },

  pickCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
  },

  pickIcon: {
    fontSize: 24,
  },

  pickCardTitle: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },

  formTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },

  currencySign: {
    fontSize: FontSize.title,
    color: Colors.primary,
  },

  amountInput: {
    flex: 1,
    fontSize: FontSize.title,
    color: Colors.textPrimary,
  },

  fieldLabel: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },

  dateRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  datePill: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  datePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  datePillText: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },

  datePillTextActive: {
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },

  dateDisplayPill: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.cardAlt,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
  },

  notesInput: {
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minHeight: 80,
  },

  attachReceiptBtn: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },

  footer: {
    padding: Spacing.xl,
  },

  closeBtnText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});