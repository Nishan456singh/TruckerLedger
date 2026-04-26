import CategorySelector from "@/components/CategorySelector";
import PrimaryButton from "@/components/PrimaryButton";
import ScreenBackground from "@/components/ScreenBackground";

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
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

/* ---------------- HELPERS ---------------- */

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function parseAmount(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

/* ---------------- SCREEN ---------------- */

export default function ScanReceiptScreen() {
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();

  const [imageUri, setImageUri] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("fuel");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());

  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [, setIsOCRing] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");

  /* ---------------- OCR ---------------- */

  const performOCR = useCallback(async (uri: string) => {
    setIsOCRing(true);
    setOcrStatus("Reading receipt...");

    try {
      const res = await extractReceiptText(uri);

      if (!res.success) {
        setOcrStatus("Unable to read receipt");
        return;
      }

      setOcrStatus("Parsing receipt...");

      const parsed = parseReceipt(res.fullText);

      if (parsed.amount) setAmount(String(parsed.amount));
      if (parsed.date) setDate(parsed.date);
      if (parsed.vendor) setNote(parsed.vendor);

      setOcrStatus("");
    } catch {
      setOcrStatus("OCR failed");
    } finally {
      setIsOCRing(false);
    }
  }, []);

  /* ---------------- CAPTURE ---------------- */

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      const result = await saveImageLocally(photo.uri, "receipts");

      if (!result.success || !result.path) {
        Alert.alert("Error", "Failed to save receipt image");
        return;
      }

      setImageUri(result.path);

      performOCR(result.path);
    } catch {
      Alert.alert("Error", "Failed to capture receipt");
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, performOCR]);

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

      Alert.alert("Receipt saved!");
      router.back();
    } catch {
      Alert.alert("Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [amount, category, note, date, imageUri]);

  /* ---------------- PERMISSIONS ---------------- */

  if (!permission) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" color="#4F8CFF" />
          <Text style={styles.helper}>Loading camera...</Text>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.center}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Allow camera access to scan receipts.
          </Text>

          <PrimaryButton
            label="Enable Camera"
            onPress={requestPermission}
          />
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  /* ---------------- EDIT SCREEN ---------------- */

  if (imageUri) {
    return (
      <ScreenBackground>
        <LinearGradient
          colors={["#05060A", "#0E1016", "#181A21"]}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Receipt Captured</Text>

              {ocrStatus ? (
                <Text style={styles.heroSub}>{ocrStatus}</Text>
              ) : (
                <Text style={styles.heroSub}>Review and save expense</Text>
              )}
            </View>

            <View style={styles.card}>
              <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
                <ScrollView contentContainerStyle={styles.form}>
                  <Text style={styles.label}>Amount</Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="$0.00"
                    placeholderTextColor="#888"
                    style={styles.input}
                  />

                  <Text style={styles.label}>Date</Text>
                  <TextInput
                    value={date}
                    onChangeText={setDate}
                    style={styles.input}
                  />

                  <CategorySelector selected={category} onChange={setCategory} />

                  <Text style={styles.label}>Vendor / Note</Text>
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder="Store name"
                    placeholderTextColor="#888"
                    style={styles.input}
                  />

                  <PrimaryButton
                    label="Save Receipt"
                    onPress={handleSave}
                    loading={isSaving}
                  />

                  <TouchableOpacity
                    onPress={() => setImageUri(null)}
                    style={styles.retake}
                  >
                    <Text style={styles.retakeText}>Retake</Text>
                  </TouchableOpacity>
                </ScrollView>
              </KeyboardAvoidingView>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </ScreenBackground>
    );
  }

  /* ---------------- CAMERA SCREEN ---------------- */

  return (
    <ScreenBackground>
      <LinearGradient
        colors={["#05060A", "#0E1016", "#181A21"]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.cameraHeader}>
            <Text style={styles.heroTitle}>Scan Receipt</Text>
            <Text style={styles.heroSub}>
              Align receipt inside the frame
            </Text>
          </View>

          <CameraView ref={cameraRef} style={styles.camera} />

          <View style={styles.captureWrap}>
            <PrimaryButton
              label="Capture Receipt"
              onPress={handleCapture}
              loading={isCapturing}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ScreenBackground>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  helper: {
    marginTop: 10,
    color: "#aaa",
  },

  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },

  permissionText: {
    marginTop: 10,
    color: "#aaa",
    marginBottom: 20,
    textAlign: "center",
  },

  hero: {
    padding: 24,
    alignItems: "center",
  },

  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },

  heroSub: {
    marginTop: 6,
    color: "#aaa",
  },

  card: {
    flex: 1,
    backgroundColor: "rgba(20,22,28,0.95)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  form: {
    padding: 24,
    gap: 16,
  },

  label: {
    color: "#bbb",
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 14,
    borderRadius: 12,
    color: "#fff",
  },

  retake: {
    alignItems: "center",
    marginTop: 10,
  },

  retakeText: {
    color: "#aaa",
  },

  cameraHeader: {
    alignItems: "center",
    paddingTop: 20,
  },

  camera: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
  },

  captureWrap: {
    padding: 20,
  },
});