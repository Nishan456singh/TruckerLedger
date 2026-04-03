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
import { parseBOL } from "@/lib/bol/bolParser";
import { createBOL } from "@/lib/bolService";
import { extractReceiptText } from "@/lib/receipt/ocrService";
import { saveImageLocally } from "@/lib/storage/imageStorage";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ───────────────────────────── */

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

/* ───────────────────────────── */

export default function ScanBOLScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOCRing, setIsOCRing] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);

  const [pickupLocation, setPickupLocation] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [loadAmount, setLoadAmount] = useState("");
  const [broker, setBroker] = useState("");
  const [date, setDate] = useState(todayISO());
  const [ocrStatus, setOcrStatus] = useState("");

  /* ───────── OCR ───────── */

  const performOCR = useCallback(async (uri: string) => {
    setIsOCRing(true);
    setOcrStatus("Extracting text...");

    try {
      const ocrResult = await extractReceiptText(uri);

      if (!ocrResult.success) {
        setOcrStatus("Fill manually");
        return;
      }

      setOcrStatus("Parsing data...");

      const parsed = parseBOL(ocrResult.fullText);

      if (parsed.pickupLocation) setPickupLocation(parsed.pickupLocation);
      if (parsed.deliveryLocation)
        setDeliveryLocation(parsed.deliveryLocation);
      if (parsed.loadAmount) setLoadAmount(String(parsed.loadAmount));
      if (parsed.broker) setBroker(parsed.broker);
      if (parsed.date) setDate(parsed.date);

      setOcrStatus("");
    } catch (err) {
      console.error(err);
      setOcrStatus("OCR failed");
    } finally {
      setIsOCRing(false);
    }
  }, []);

  /* ───────── CAPTURE ───────── */

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);

      // Capture photo from camera
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8, // Initial quality, will be re-compressed by imageStorage
      });

      // Save to local storage with compression
      const result = await saveImageLocally(photo.uri, "bols");

      if (!result.success || !result.path) {
        Alert.alert("Error", result.error || "Failed to save BOL image");
        return;
      }

      setImageUri(result.path);

      // Perform OCR on the saved image
      await performOCR(result.path);
    } catch (e) {
      console.error("[ScanBOL] Capture error:", e);
      Alert.alert("Error", "Failed to capture BOL");
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, performOCR]);

  /* ───────── SAVE ───────── */

  const handleSave = useCallback(async () => {
    if (!imageUri) {
      Alert.alert("Capture image first");
      return;
    }

    setIsSaving(true);

    try {
      await createBOL({
        pickup_location: pickupLocation,
        delivery_location: deliveryLocation,
        load_amount: Number(loadAmount) || null,
        broker,
        date,
        image_uri: imageUri,
        ocr_text: "",
      });

      Alert.alert("Saved successfully!");
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [imageUri, pickupLocation, deliveryLocation, loadAmount, broker, date]);

  /* ───────── PERMISSIONS ───────── */

  if (!permission) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
          <View style={styles.centerContainer}>
            <ActivityIndicator
              size="large"
              color={Colors.secondary}
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
              We need access to your camera to scan BOLs.
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

  /* ───────── FORM VIEW ───────── */

  if (imageUri) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
          <LinearGradient
            colors={["#6FA0C8", "#5A8FB5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroContainer}
          >
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* HERO SECTION - BOL scanning status */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <View style={styles.heroContent}>
              <Text style={styles.heroLabel}>Bill of Lading</Text>
              <Text style={styles.heroValue}>📄</Text>
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
              <KeyboardAvoidingView
                style={styles.keyboardAvoidView}
                behavior="padding"
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {/* Pickup Location Input */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Pickup Location</Text>
                    <TextInput
                      value={pickupLocation}
                      onChangeText={setPickupLocation}
                      placeholder="Where you picked up"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.input}
                    />
                  </View>

                  {/* Delivery Location Input */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Delivery Location</Text>
                    <TextInput
                      value={deliveryLocation}
                      onChangeText={setDeliveryLocation}
                      placeholder="Where you're delivering"
                      placeholderTextColor={Colors.textMuted}
                      style={styles.input}
                    />
                  </View>

                  {/* Load Amount Input */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Load Amount</Text>
                    <TextInput
                      value={loadAmount}
                      onChangeText={setLoadAmount}
                      placeholder="$0.00"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="decimal-pad"
                      style={styles.input}
                    />
                  </View>

                  {/* Broker Input */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Broker</Text>
                    <TextInput
                      value={broker}
                      onChangeText={setBroker}
                      placeholder="Broker name or ID"
                      placeholderTextColor={Colors.textMuted}
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

                  {/* Save Button */}
                  <View style={styles.buttonGroup}>
                    <PrimaryButton
                      label={isSaving ? "Saving..." : "Save BOL"}
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

  /* ───────── CAMERA VIEW ───────── */

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <LinearGradient
          colors={["#6FA0C8", "#5A8FB5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cameraContainer}
        >
          {/* Camera Hero Label */}
          <View style={styles.cameraHeader}>
            <Text style={styles.cameraHeaderText}>Scan BOL</Text>
            <Text style={styles.cameraHeaderSubtext}>
              Position your BOL in the frame
            </Text>
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

/* ───────── STYLES ───────── */

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
