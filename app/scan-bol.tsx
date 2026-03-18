import HighContrastCard from "@/components/HighContrastCard";
import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Spacing,
} from "@/constants/theme";
import { parseBOLWithAI } from "@/lib/ai/bolAI";
import { isBOLParseWeak, parseBOLText } from "@/lib/bolParser";
import { createBOL } from "@/lib/bolService";
import { extractTextFromImage } from "@/lib/receipt/ocrService";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");

  const [pickupLocation, setPickupLocation] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [loadAmount, setLoadAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [broker, setBroker] = useState("");

  async function handleCapture() {
    if (!cameraRef.current || isCapturing || isProcessing) return;

    try {
      setIsCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setImageUri(photo.uri);

      setIsProcessing(true);

      const ocr = await extractTextFromImage(photo.uri);
      const text = ocr.text;
      setOcrText(text);

      if (!text.trim()) {
        Alert.alert(
          "Could not read text",
          ocr.engine === "none"
            ? "OCR engine is not available in this runtime. Use a development build to enable BOL OCR."
            : "No readable text was detected in this image. Try better lighting and alignment."
        );
        return;
      }

      const parsed = parseBOLText(text);
      let finalParsed = parsed;

      if (isBOLParseWeak(parsed)) {
        const aiParsed = await parseBOLWithAI(text);

        if (aiParsed) {
          finalParsed = {
            pickup_location: aiParsed.pickup_location || parsed.pickup_location,
            delivery_location: aiParsed.delivery_location || parsed.delivery_location,
            load_amount: aiParsed.load_amount ?? parsed.load_amount,
            date: aiParsed.date || parsed.date,
            broker: aiParsed.broker || parsed.broker,
          };
        }
      }

      setPickupLocation(finalParsed.pickup_location);
      setDeliveryLocation(finalParsed.delivery_location);
      setLoadAmount(finalParsed.load_amount !== null ? String(finalParsed.load_amount) : "");
      setDate(finalParsed.date || todayISO());
      setBroker(finalParsed.broker);

      if (isBOLParseWeak(finalParsed)) {
        Alert.alert("Review required", "Could not fully parse this BOL. Please edit fields manually.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to scan BOL.";
      Alert.alert("Scan failed", message);
    } finally {
      setIsCapturing(false);
      setIsProcessing(false);
    }
  }

  async function handleSaveBOL() {
    if (!imageUri) {
      Alert.alert("Capture required", "Capture a BOL photo before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const amountValue = Number(loadAmount.replace(/[^\d.-]/g, ""));

      await createBOL({
        pickup_location: pickupLocation.trim(),
        delivery_location: deliveryLocation.trim(),
        load_amount: Number.isFinite(amountValue) && amountValue > 0 ? amountValue : null,
        date,
        broker: broker.trim(),
        image_uri: imageUri,
        ocr_text: ocrText || null,
      });

      Alert.alert("Saved", "BOL saved to local history.");
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.helperText}>Loading camera permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <Text style={styles.title}>Camera access required</Text>
          <Text style={styles.helperText}>Grant permission to scan BOL documents.</Text>

          <Pressable onPress={requestPermission} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Grant Access</Text>
          </Pressable>
        </View>
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
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
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
            disabled={isCapturing || isProcessing}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && { opacity: 0.85 },
              (isCapturing || isProcessing) && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {isProcessing ? "Processing..." : isCapturing ? "Capturing..." : "Capture BOL"}
            </Text>
          </Pressable>

          <HighContrastCard style={styles.card}>
            <Text style={styles.fieldLabel}>Pickup Location</Text>
            <TextInput value={pickupLocation} onChangeText={setPickupLocation} style={styles.input} />

            <Text style={styles.fieldLabel}>Delivery Location</Text>
            <TextInput value={deliveryLocation} onChangeText={setDeliveryLocation} style={styles.input} />

            <Text style={styles.fieldLabel}>Load Amount</Text>
            <TextInput
              value={loadAmount}
              onChangeText={setLoadAmount}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
            <TextInput value={date} onChangeText={setDate} style={styles.input} />

            <Text style={styles.fieldLabel}>Broker</Text>
            <TextInput value={broker} onChangeText={setBroker} style={styles.input} />
          </HighContrastCard>

          <Pressable
            onPress={handleSaveBOL}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.saveBtn,
              pressed && { opacity: 0.85 },
              isSaving && { opacity: 0.7 },
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
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
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
