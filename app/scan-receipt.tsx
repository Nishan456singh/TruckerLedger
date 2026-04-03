import PrimaryButton from "@/components/PrimaryButton";
import ScreenBackground from "@/components/ScreenBackground";
import { getShadow } from "@/constants/shadowUtils";

import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
    TypographyScale,
} from "@/constants/theme";

import { addExpense } from "@/lib/expenseService";
import { extractReceiptText } from "@/lib/receipt/ocrService";
import { parseReceipt } from "@/lib/receipt/receiptParser";
import { saveImageLocally } from "@/lib/storage/imageStorage";
import type { Category } from "@/lib/types";

import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import React, { useCallback, useRef, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

/* ---------------- HELPERS ---------------- */

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

const CATEGORY_EMOJIS: Record<Category, string> = {
  fuel: "⛽",
  food: "🍔",
  repair: "🔧",
  toll: "🛣️",
  parking: "🅿️",
  other: "📦",
};

/**
 * CAPTURE & SAVE IMAGE
 * Uses new unified storage system with compression
 */

/* ---------------- SCREEN ---------------- */

export default function ScanReceiptScreen() {
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();

  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOCRing, setIsOCRing] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("fuel");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());

  const [ocrStatus, setOcrStatus] = useState("");

  /* ---------------- CAPTURE ---------------- */

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);

      // Capture photo from camera
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8, // Initial quality, will be re-compressed by imageStorage
      });

      // Save to local storage with compression
      const result = await saveImageLocally(photo.uri, "receipts");

      if (!result.success || !result.path) {
        Alert.alert("Error", result.error || "Failed to save receipt image");
        return;
      }

      setImageUri(result.path);

      // Perform OCR on the saved image
      performOCR(result.path);
    } catch (e) {
      console.error("[ScanReceipt] Capture error:", e);
      Alert.alert("Error", "Failed to capture receipt");
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  /* ---------------- OCR ---------------- */

  const performOCR = useCallback(async (uri: string) => {
    setIsOCRing(true);
    setOcrStatus("Reading receipt...");

    try {
      const res = await extractReceiptText(uri);

      if (!res.success) {
        setOcrStatus("Couldn't read receipt");
        return;
      }

      setOcrStatus("Parsing data...");

      const parsed = parseReceipt(res.fullText);

      if (parsed.amount) setAmount(String(parsed.amount));
      if (parsed.category) setCategory(parsed.category);
      if (parsed.date) setDate(parsed.date);
      if (parsed.vendor) setNote(parsed.vendor);

      setOcrStatus("");
    } catch (e) {
      console.error(e);
      setOcrStatus("OCR failed");
    } finally {
      setIsOCRing(false);
    }
  }, []);

  /* ---------------- SAVE ---------------- */

  const handleSave = useCallback(async () => {
    const parsed = parseAmount(amount);

    if (parsed <= 0) {
      Alert.alert("Invalid amount");
      return;
    }

    if (!imageUri) {
      Alert.alert("Capture receipt first");
      return;
    }

    try {
      setIsSaving(true);

      await addExpense({
        amount: parsed,
        category,
        note: note.trim(),
        date,
        receipt_uri: imageUri,
      });

      Alert.alert("Saved!");
      router.back();
    } catch (e) {
      Alert.alert("Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [amount, category, date, note, imageUri]);

  /* ---------------- PERMISSIONS ---------------- */

  if (!permission) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
          <View style={styles.centerContainer}>
            <ActivityIndicator
              size="large"
              color={Colors.accent}
              style={{ marginBottom: Spacing.lg }}
            />
            <Text style={styles.loadingText}>Loading camera...</Text>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
          <View style={styles.centerContainer}>
            <Text style={styles.permissionTitle}>Camera Access Required</Text>
            <Text style={styles.permissionText}>
              We need access to your camera to scan receipts.
            </Text>
            <PrimaryButton
              label="Grant Camera Access"
              onPress={requestPermission}
            />
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  /* ---------------- EDIT SCREEN ---------------- */

  if (imageUri) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
          <LinearGradient
            colors={["#FF8C42", "#E67E2F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroContainer}
          >
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* HERO SECTION - Receipt scanning status */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <View style={styles.heroContent}>
              <Text style={styles.heroLabel}>Receipt Scan</Text>
              <Text style={styles.heroValue}>📸</Text>
              {ocrStatus ? (
                <Text style={styles.ocrStatusText}>{ocrStatus}</Text>
              ) : (
                <Text style={styles.heroHint}>Ready to save</Text>
              )}
            </View>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* FLOATING CARD - Form content */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <View style={styles.floatingCard}>
              <KeyboardAvoidingView style={styles.keyboardAvoidView} behavior="padding">
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {/* Amount Input */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Amount</Text>
                    <TextInput
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="$0.00"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="decimal-pad"
                      style={styles.input}
                    />
                  </View>

                  {/* Date Input */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Date</Text>
                    <TextInput
                      value={date}
                      onChangeText={setDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.input}
                    />
                  </View>

                  {/* Note Input */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Vendor / Note</Text>
                    <TextInput
                      value={note}
                      onChangeText={setNote}
                      placeholder="Where did you shop?"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.input}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  {/* Save Button */}
                  <View style={styles.buttonGroup}>
                    <PrimaryButton
                      label="Save Receipt"
                      onPress={handleSave}
                      loading={isSaving}
                      disabled={isSaving || isOCRing}
                    />

                    <TouchableOpacity
                      onPress={() => setImageUri(null)}
                      style={styles.retakeButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.retakeText}>↻ Retake</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </View>
          </LinearGradient>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  /* ---------------- CAMERA SCREEN ---------------- */

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <LinearGradient
          colors={["#FF8C42", "#E67E2F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cameraContainer}
        >
          {/* Camera Hero Label */}
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraHeaderText}>Scan Receipt</Text>
            <Text style={styles.cameraHeaderSubtext}>Position your receipt in the frame</Text>
          </View>

          {/* Camera View */}
          <CameraView ref={cameraRef} style={styles.camera} />

          {/* Capture Button at Bottom */}
          <View style={styles.captureButtonContainer}>
            <PrimaryButton
              label="Capture"
              onPress={handleCapture}
              loading={isCapturing}
            />
          </View>
        </LinearGradient>
      </SafeAreaView>
    </ScreenBackground>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  /* ─── LAYOUT FOUNDATION ─────────────────────────────────────────────── */
  safe: {
    flex: 1,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },

  /* ─── PERMISSION SCREENS ───────────────────────────────────────────── */
  loadingText: {
    ...TypographyScale.body,
    color: Colors.textMuted,
    textAlign: "center",
  },

  permissionTitle: {
    ...TypographyScale.title,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.md,
  },

  permissionText: {
    ...TypographyScale.body,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },

  /* ─── CAMERA SCREEN ────────────────────────────────────────────────── */
  cameraContainer: {
    flex: 1,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  cameraHeader: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },

  cameraHeaderText: {
    ...TypographyScale.title,
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
  },

  cameraHeaderSubtext: {
    ...TypographyScale.small,
    color: "rgba(255, 255, 255, 0.75)",
  },

  camera: {
    flex: 1,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    ...getShadow(Shadow.large),
  },

  captureButtonContainer: {
    paddingHorizontal: Spacing.lg,
  },

  /* ─── EDIT SCREEN - HERO + FLOATING CARD ──────────────────────────── */
  heroContainer: {
    flex: 1,
  },

  heroContent: {
    alignItems: "center",
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },

  heroLabel: {
    ...TypographyScale.small,
    color: "rgba(255, 255, 255, 0.75)",
    marginBottom: Spacing.sm,
  },

  heroValue: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },

  heroHint: {
    ...TypographyScale.caption,
    color: "rgba(255, 255, 255, 0.7)",
  },

  ocrStatusText: {
    ...TypographyScale.caption,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: FontWeight.semibold,
  },

  /* ─── FLOATING CARD ───────────────────────────────────────────────── */
  floatingCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    marginTop: -Spacing.xl,
    overflow: "hidden",
    ...getShadow(Shadow.large),
  },

  keyboardAvoidView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
    gap: Spacing.md,
  },

  /* ─── FORM ELEMENTS ───────────────────────────────────────────────── */
  formGroup: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },

  label: {
    ...TypographyScale.small,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },

  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginVertical: Spacing.xs,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...getShadow(Shadow.small),
  },

  /* ─── BUTTON GROUP ────────────────────────────────────────────────── */
  buttonGroup: {
    gap: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },

  retakeButton: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surfaceAlt,
  },

  retakeText: {
    ...TypographyScale.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },
});