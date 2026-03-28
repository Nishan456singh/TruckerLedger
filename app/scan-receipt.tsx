import PrimaryButton from "@/components/PrimaryButton";
import ScreenBackground from "@/components/ScreenBackground";
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
import { LinearGradient } from "expo-linear-gradient";
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
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
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
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
          <View style={styles.centerWrap}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.helperText}>Loading camera...</Text>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
          <View style={styles.centerWrap}>
            <Text style={styles.title}>Camera access required</Text>
            <Text style={styles.helperText}>Grant permission to scan receipts.</Text>

            <Pressable onPress={requestPermission} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Grant Access</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  if (imageUri) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.container}>
              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* HERO SECTION (30% - Red/Edit themed)                          */}
              {/* ═══════════════════════════════════════════════════════════════ */}

              <LinearGradient
                colors={[Colors.accent, '#A01B3A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.detailsHeroSection}
              >
                {/* Top Bar */}
                <View style={styles.detailsHeroTopBar}>
                  <TouchableOpacity
                    onPress={() => {
                      setImageUri(null);
                      setOcrStatus("");
                    }}
                    disabled={isOCRing}
                  >
                    <Text style={styles.detailsHeroBackText}>✕</Text>
                  </TouchableOpacity>
                  <Text style={styles.detailsHeroTitle}>Review & Edit</Text>
                  <View style={{ width: 40 }} />
                </View>
              </LinearGradient>

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* FLOATING CARD (70%+ - Receipt Details & Form)                 */}
              {/* ═══════════════════════════════════════════════════════════════ */}

              <View style={styles.detailsCardContainer}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.detailsCardContent}
                >
                  {/* OCR Status */}
                  {isOCRing && (
                    <Animated.View entering={FadeInDown} style={styles.statusCard}>
                      <ActivityIndicator color={Colors.accent} size="small" />
                      <Text style={styles.statusText}>{ocrStatus}</Text>
                    </Animated.View>
                  )}

                  {ocrStatus && !isOCRing && (
                    <Animated.View entering={FadeInDown} style={styles.warningCard}>
                      <Text style={styles.warningText}>⚠️ {ocrStatus}</Text>
                    </Animated.View>
                  )}

                  {/* Amount Input */}
                  <Animated.View entering={FadeInDown}>
                    <Text style={styles.detailsFieldLabel}>💰 Amount</Text>
                    <View style={styles.detailsAmountContainer}>
                      <Text style={styles.detailsCurrencySign}>$</Text>
                      <TextInput
                        style={styles.detailsInput}
                        value={amount}
                        onChangeText={setAmount}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        placeholderTextColor={Colors.textMuted}
                        editable={!isOCRing}
                      />
                    </View>
                  </Animated.View>

                  {/* Category Selector */}
                  <Animated.View entering={FadeInDown.delay(50)}>
                    <Text style={styles.detailsFieldLabel}>📁 Category</Text>
                    <View style={styles.categoryGrid}>
                      {(["fuel", "food", "repair", "toll", "parking", "other"] as Category[]).map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]}
                          onPress={() => setCategory(cat)}
                          disabled={isOCRing}
                        >
                          <Text style={styles.categoryEmoji}>{CATEGORY_EMOJIS[cat]}</Text>
                          <Text style={styles.categoryName}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Animated.View>

                  {/* Date & Note */}
                  <Animated.View entering={FadeInDown.delay(100)} style={styles.fieldsBlock}>
                    <View>
                      <Text style={styles.detailsFieldLabel}>📅 Date</Text>
                      <TextInput
                        value={date}
                        onChangeText={setDate}
                        style={styles.detailsInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={Colors.textMuted}
                        editable={!isOCRing}
                      />
                    </View>

                    <View>
                      <Text style={styles.detailsFieldLabel}>📝 Note (Optional)</Text>
                      <TextInput
                        style={[styles.detailsInput, { height: 70, paddingTop: Spacing.xl, textAlignVertical: "top" }]}
                        value={note}
                        onChangeText={setNote}
                        placeholder="Optional note"
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        editable={!isOCRing}
                      />
                    </View>
                  </Animated.View>
                </ScrollView>

                {/* Footer with Save/Cancel */}
                <Animated.View entering={FadeInUp} style={styles.detailsCardFooter}>
                  <PrimaryButton
                    label="💾 Save Receipt"
                    onPress={handleSave}
                    loading={isSaving}
                    disabled={isSaving || isOCRing || Number(amount) <= 0}
                    fullWidth
                  />
                  <TouchableOpacity
                    style={styles.detailsCancelBtn}
                    onPress={() => {
                      setImageUri(null);
                      setOcrStatus("");
                    }}
                    disabled={isOCRing || isSaving}
                  >
                    <Text style={styles.detailsCancelBtnText}>Take Another Photo</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </View>
          </KeyboardAvoidingView>
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
            {/* HERO SECTION (35% - Red/Receipt themed)                        */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            <LinearGradient
              colors={[Colors.accent, '#A01B3A']}
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
                <Text style={styles.heroTitle}>Scan Receipt</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Centered Message */}
              <View style={styles.heroMessageCenter}>
                <Text style={styles.heroEmoji}>📸</Text>
                <Text style={styles.heroMessage}>Position receipt</Text>
                <Text style={styles.heroSubMessage}>in frame to capture</Text>
              </View>
            </LinearGradient>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* CAMERA VIEW (65% - Floating Card Style)                        */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            <View style={styles.cameraCardContainer}>
              <View style={styles.cameraWrap}>
                <CameraView ref={cameraRef} style={styles.camera} facing="back" mode="picture" />
              </View>

              {/* Capture Button & Hint */}
              <Animated.View entering={FadeInUp} style={styles.captureButtonWrap}>
                <Text style={styles.captureHint}>✓ Center your receipt for best results</Text>
                <PrimaryButton
                  label="📸 Capture Receipt"
                  onPress={handleCapture}
                  loading={isCapturing}
                  disabled={isCapturing}
                  size="large"
                  fullWidth
                />
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

  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.sm,
  },

  // ─── CAMERA VIEW: HERO SECTION ──────────────────────────────────────

  heroSection: {
    flex: 0.35,
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

  heroMessageCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },

  heroEmoji: {
    fontSize: FontSize.hero,
  },

  heroMessage: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },

  heroSubMessage: {
    fontSize: FontSize.caption,
    color: "rgba(255, 255, 255, 0.7)",
  },

  // ─── CAMERA VIEW: CAMERA CARD ───────────────────────────────────────

  cameraCardContainer: {
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

  cameraWrap: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    margin: Spacing.lg,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.accent + "30",
  },

  camera: {
    flex: 1,
  },

  captureButtonWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  captureHint: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    textAlign: "center",
  },

  // ─── RECEIPT DETAILS: HERO SECTION ──────────────────────────────────

  detailsHeroSection: {
    flex: 0.30,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.md,
    justifyContent: "center",
  },

  detailsHeroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  detailsHeroBackText: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  detailsHeroTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  // ─── RECEIPT DETAILS: FLOATING CARD ─────────────────────────────────

  detailsCardContainer: {
    flex: 0.70,
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

  detailsCardContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.lg,
  },

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.accent + "10",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.accent + "30",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },

  statusText: {
    color: Colors.accent,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
  },

  warningCard: {
    backgroundColor: Colors.warning + "15",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.warning + "50",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },

  warningText: {
    color: Colors.warning,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
  },

  detailsFieldLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },

  detailsAmountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },

  detailsCurrencySign: {
    fontSize: FontSize.title,
    color: Colors.textMuted,
    marginRight: Spacing.xs,
  },

  detailsInput: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },

  categoryBtn: {
    width: "31%",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
  },

  categoryBtnActive: {
    backgroundColor: Colors.accent + "20",
    borderColor: Colors.accent,
  },

  categoryEmoji: {
    fontSize: 20,
  },

  categoryName: {
    fontSize: FontSize.tiny,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
  },

  fieldsBlock: {
    gap: Spacing.lg,
  },

  detailsCardFooter: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  detailsCancelBtn: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },

  detailsCancelBtnText: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
  },

  // ─── PERMISSION SCREENS ─────────────────────────────────────────────

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

  primaryBtn: {
    minHeight: 52,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },

  primaryBtnText: {
    color: Colors.background,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
});
