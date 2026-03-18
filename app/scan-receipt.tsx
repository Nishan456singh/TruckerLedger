import HighContrastCard from "@/components/HighContrastCard";
import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Spacing,
} from "@/constants/theme";
import { addExpense } from "@/lib/expenseService";
import { extractReceiptText } from "@/lib/receipt/ocrService";
import { parseReceipt } from "@/lib/receipt/receiptParser";
import type { Category } from "@/lib/types";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

const CATEGORY_EMOJIS: Record<Category, string> = {
  fuel: "⛽",
  food: "🍔",
  repair: "🔧",
  toll: "🛣️",
  parking: "🅿️",
  other: "📦",
};

export default function ScanReceiptScreen() {
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOCRing, setIsOCRing] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("fuel");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [ocrStatus, setOcrStatus] = useState<string>("");

  async function handleCapture() {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setImageUri(photo.uri);

      // Auto-run OCR after photo is captured
      await performOCR(photo.uri);
    } catch (error) {
      Alert.alert("Capture failed", "Could not capture photo");
      console.error(error);
    } finally {
      setIsCapturing(false);
    }
  }

  async function performOCR(uri: string) {
    setIsOCRing(true);
    setOcrStatus("Extracting text...");

    try {
      const ocrResult = await extractReceiptText(uri);

      if (!ocrResult.success) {
        setOcrStatus("Could not extract text. Please fill in manually.");
        setIsOCRing(false);
        return;
      }

      setOcrStatus("Parsing receipt...");

      const parsed = parseReceipt(ocrResult.fullText);

      // Auto-fill fields
      if (parsed.amount) {
        setAmount(parsed.amount.toString());
      }

      if (parsed.category) {
        setCategory(parsed.category);
      }

      if (parsed.date) {
        setDate(parsed.date);
      }

      if (parsed.vendor) {
        setNote(parsed.vendor);
      }

      setOcrStatus("");
    } catch (error) {
      console.error("OCR failed:", error);
      setOcrStatus("Error processing receipt");
    } finally {
      setIsOCRing(false);
    }
  }

  async function handleSave() {
    const parsedAmount = Number(amount.replace(/[^\d.]/g, ""));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid amount.");
      return;
    }

    setIsSaving(true);

    try {
      await addExpense({
        amount: parsedAmount,
        category,
        note: note.trim(),
        date,
        receipt_uri: imageUri,
      });

      Alert.alert("Saved", "Receipt saved successfully.");
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save receipt.";
      Alert.alert("Save failed", message);
    } finally {
      setIsSaving(false);
    }
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.helperText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <Text style={styles.title}>Camera access required</Text>
          <Text style={styles.helperText}>Grant permission to scan receipts.</Text>

          <Pressable onPress={requestPermission} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Grant Access</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (imageUri) {
    return (
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => {
                  setImageUri(null);
                  setOcrStatus("");
                }}
                disabled={isOCRing}
              >
                <Text style={styles.backText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Receipt Details</Text>
              <View style={{ width: 36 }} />
            </View>

            {isOCRing && (
              <HighContrastCard style={[styles.card, styles.ocrCard]}>
                <ActivityIndicator color={Colors.primary} size="small" />
                <Text style={styles.ocrStatus}>{ocrStatus}</Text>
              </HighContrastCard>
            )}

            {ocrStatus && !isOCRing && (
              <HighContrastCard style={[styles.card, styles.ocrWarning]}>
                <Text style={styles.ocrWarningText}>⚠️ {ocrStatus}</Text>
              </HighContrastCard>
            )}

            <HighContrastCard style={styles.card}>
              <Text style={styles.fieldLabel}>Amount</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.textMuted}
                editable={!isOCRing}
              />

              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {(["fuel", "food", "repair", "toll", "parking", "other"] as Category[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]}
                    onPress={() => setCategory(cat)}
                    disabled={isOCRing}
                  >
                    <Text style={styles.categoryEmoji}>{CATEGORY_EMOJIS[cat]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Date</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                style={styles.input}
                editable={!isOCRing}
              />

              <Text style={styles.fieldLabel}>Note</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={note}
                onChangeText={setNote}
                placeholder="Optional note"
                placeholderTextColor={Colors.textMuted}
                multiline
                editable={!isOCRing}
              />
            </HighContrastCard>

            <Pressable
              onPress={handleSave}
              disabled={isSaving || isOCRing}
              style={({ pressed }) => [
                styles.saveBtn,
                pressed && { opacity: 0.85 },
                (isSaving || isOCRing) && { opacity: 0.7 },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color={Colors.textPrimary} />
              ) : (
                <Text style={styles.saveBtnText}>Save Receipt</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Scan Receipt</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={styles.cameraWrap}>
            <CameraView ref={cameraRef} style={styles.camera} facing="back" mode="picture" />
          </View>

          <Pressable
            onPress={handleCapture}
            disabled={isCapturing}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && { opacity: 0.85 },
              isCapturing && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {isCapturing ? "Capturing..." : "Capture Receipt"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backText: {
    fontSize: 28,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  title: {
    fontSize: FontSize.section,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  helperText: {
    color: Colors.textSecondary,
    textAlign: "center",
    fontSize: FontSize.body,
  },
  cameraWrap: {
    height: 280,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  camera: {
    flex: 1,
  },
  card: {
    gap: Spacing.xs,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  categoryGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  categoryBtn: {
    width: "31%",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.card,
  },
  categoryBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  ocrCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.cardAlt,
  },
  ocrStatus: {
    color: Colors.textSecondary,
    fontSize: FontSize.caption,
  },
  ocrWarning: {
    backgroundColor: "rgba(255, 152, 0, 0.1)",
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  ocrWarningText: {
    color: Colors.warning,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
  saveBtn: {
    minHeight: 52,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  saveBtnText: {
    color: Colors.background,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
});
