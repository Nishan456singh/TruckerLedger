import HighContrastCard from "@/components/HighContrastCard";
import ScreenBackground from "@/components/ScreenBackground";
import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Spacing,
} from "@/constants/theme";
import { parseBOL } from "@/lib/bol/bolParser";
import { createBOL } from "@/lib/bolService";
import { extractReceiptText } from "@/lib/receipt/ocrService";
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

export default function ScanBOLScreen() {
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOCRing, setIsOCRing] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [pickupLocation, setPickupLocation] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [loadAmount, setLoadAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [broker, setBroker] = useState("");
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

      setOcrStatus("Parsing BOL...");

      const parsed = parseBOL(ocrResult.fullText);

      // Auto-fill fields
      if (parsed.pickupLocation) {
        setPickupLocation(parsed.pickupLocation);
      }

      if (parsed.deliveryLocation) {
        setDeliveryLocation(parsed.deliveryLocation);
      }

      if (parsed.loadAmount) {
        setLoadAmount(parsed.loadAmount.toString());
      }

      if (parsed.date) {
        setDate(parsed.date);
      }

      if (parsed.broker) {
        setBroker(parsed.broker);
      }

      setOcrStatus("");
    } catch (error) {
      console.error("OCR failed:", error);
      setOcrStatus("Error processing BOL");
    } finally {
      setIsOCRing(false);
    }
  }

  async function handleSave() {
    if (!pickupLocation.trim() || !deliveryLocation.trim()) {
      Alert.alert("Required fields", "Please enter pickup and delivery locations.");
      return;
    }

    const loadAmountNum = Number(loadAmount.replace(/[^\d.]/g, ""));

    setIsSaving(true);

    try {
      await createBOL({
        pickup_location: pickupLocation.trim(),
        delivery_location: deliveryLocation.trim(),
        load_amount: Number.isFinite(loadAmountNum) && loadAmountNum > 0 ? loadAmountNum : null,
        date,
        broker: broker.trim(),
        image_uri: imageUri,
      });

      Alert.alert("Saved", "BOL saved successfully.");
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save BOL.";
      Alert.alert("Save failed", message);
    } finally {
      setIsSaving(false);
    }
  }

  if (!permission) {
    return (
      <ScreenBackground>
      <SafeAreaView style={styles.safe}>
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <Text style={styles.title}>Camera access required</Text>
          <Text style={styles.helperText}>Grant permission to scan BOLs.</Text>

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
              <Text style={styles.title}>BOL Details</Text>
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
              <Text style={styles.fieldLabel}>Pickup Location</Text>
              <TextInput
                value={pickupLocation}
                onChangeText={setPickupLocation}
                style={styles.input}
                editable={!isOCRing}
              />

              <Text style={styles.fieldLabel}>Delivery Location</Text>
              <TextInput
                value={deliveryLocation}
                onChangeText={setDeliveryLocation}
                style={styles.input}
                editable={!isOCRing}
              />

              <Text style={styles.fieldLabel}>Load Amount</Text>
              <TextInput
                value={loadAmount}
                onChangeText={setLoadAmount}
                keyboardType="decimal-pad"
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={Colors.textMuted}
                editable={!isOCRing}
              />

              <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                style={styles.input}
                editable={!isOCRing}
              />

              <Text style={styles.fieldLabel}>Broker</Text>
              <TextInput
                value={broker}
                onChangeText={setBroker}
                style={styles.input}
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
                <Text style={styles.saveBtnText}>Save BOL</Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
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
            <Text style={styles.title}>Scan BOL</Text>
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
              {isCapturing ? "Capturing..." : "Capture BOL"}
            </Text>
          </Pressable>
        </ScrollView>
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
