import PrimaryButton from "@/components/PrimaryButton";
import ScreenBackground from "@/components/ScreenBackground";

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

/* ───────────────────────── */

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

/* ───────────────────────── */

export default function ScanBOLScreen() {
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();

  const [imageUri, setImageUri] = useState<string | null>(null);

  const [pickupLocation, setPickupLocation] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [loadAmount, setLoadAmount] = useState("");
  const [broker, setBroker] = useState("");
  const [date, setDate] = useState(todayISO());

  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOCRing, setIsOCRing] = useState(false);

  const [ocrStatus, setOcrStatus] = useState("");

  /* ───────── OCR ───────── */

  const performOCR = useCallback(async (uri: string) => {
    setIsOCRing(true);
    setOcrStatus("Reading BOL...");

    try {
      const result = await extractReceiptText(uri);

      if (!result.success) {
        setOcrStatus("Fill details manually");
        return;
      }

      setOcrStatus("Parsing shipment data...");

      const parsed = parseBOL(result.fullText);

      if (parsed.pickupLocation) setPickupLocation(parsed.pickupLocation);
      if (parsed.deliveryLocation) setDeliveryLocation(parsed.deliveryLocation);
      if (parsed.loadAmount) setLoadAmount(String(parsed.loadAmount));
      if (parsed.broker) setBroker(parsed.broker);
      if (parsed.date) setDate(parsed.date);

      setOcrStatus("");
    } catch {
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

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      const saved = await saveImageLocally(photo.uri, "bols");

      if (!saved.success || !saved.path) {
        Alert.alert("Failed to save image");
        return;
      }

      setImageUri(saved.path);

      await performOCR(saved.path);
    } catch {
      Alert.alert("Capture failed");
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, performOCR]);

  /* ───────── SAVE ───────── */

  const handleSave = useCallback(async () => {
    if (!imageUri) {
      Alert.alert("Capture BOL first");
      return;
    }

    try {
      setIsSaving(true);

      await createBOL({
        pickup_location: pickupLocation,
        delivery_location: deliveryLocation,
        load_amount: Number(loadAmount) || null,
        broker,
        date,
        image_uri: imageUri,
        ocr_text: "",
      });

      Alert.alert("BOL saved!");
      router.back();
    } catch {
      Alert.alert("Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [pickupLocation, deliveryLocation, loadAmount, broker, date, imageUri]);

  /* ───────── PERMISSIONS ───────── */

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
            Enable camera access to scan Bills of Lading.
          </Text>

          <PrimaryButton
            label="Enable Camera"
            onPress={requestPermission}
          />
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  /* ───────── FORM VIEW ───────── */

  if (imageUri) {
    return (
      <ScreenBackground>
        <LinearGradient
          colors={["#05060A", "#0E1016", "#181A21"]}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Bill of Lading</Text>

              {ocrStatus ? (
                <Text style={styles.heroSub}>{ocrStatus}</Text>
              ) : (
                <Text style={styles.heroSub}>Review shipment details</Text>
              )}
            </View>

            <View style={styles.card}>
              <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
                <ScrollView contentContainerStyle={styles.form}>
                  <Text style={styles.label}>Pickup Location</Text>
                  <TextInput
                    value={pickupLocation}
                    onChangeText={setPickupLocation}
                    placeholder="Pickup location"
                    placeholderTextColor="#888"
                    style={styles.input}
                  />

                  <Text style={styles.label}>Delivery Location</Text>
                  <TextInput
                    value={deliveryLocation}
                    onChangeText={setDeliveryLocation}
                    placeholder="Delivery location"
                    placeholderTextColor="#888"
                    style={styles.input}
                  />

                  <Text style={styles.label}>Load Amount</Text>
                  <TextInput
                    value={loadAmount}
                    onChangeText={setLoadAmount}
                    placeholder="$0.00"
                    placeholderTextColor="#888"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />

                  <Text style={styles.label}>Broker</Text>
                  <TextInput
                    value={broker}
                    onChangeText={setBroker}
                    placeholder="Broker"
                    placeholderTextColor="#888"
                    style={styles.input}
                  />

                  <Text style={styles.label}>Date</Text>
                  <TextInput
                    value={date}
                    onChangeText={setDate}
                    style={styles.input}
                  />

                  <PrimaryButton
                    label="Save BOL"
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

  /* ───────── CAMERA VIEW ───────── */

  return (
    <ScreenBackground>
      <LinearGradient
        colors={["#05060A", "#0E1016", "#181A21"]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.cameraHeader}>
            <Text style={styles.heroTitle}>Scan BOL</Text>
            <Text style={styles.heroSub}>
              Align the Bill of Lading in frame
            </Text>
          </View>

          <CameraView ref={cameraRef} style={styles.camera} />

          <View style={styles.captureWrap}>
            <PrimaryButton
              label="Capture BOL"
              onPress={handleCapture}
              loading={isCapturing}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ScreenBackground>
  );
}

/* ───────── STYLES ───────── */

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
    textAlign: "center",
    marginBottom: 20,
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