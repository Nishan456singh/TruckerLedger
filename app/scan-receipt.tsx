import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { extractReceiptText } from "../lib/receiptOcr";

export default function ScanReceiptScreen() {
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);

  async function handleCapture() {
    if (!cameraRef.current) return;
    if (isCapturing) return;

    try {
      setIsCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      console.log("Photo captured:", photo.uri);

      // OCR STEP
      const text = await extractReceiptText(photo.uri);

      console.log("OCR TEXT:", text);

      // Navigate to expense screen with receipt data
      router.push({
        pathname: "/add-expense",
        params: {
          receiptUri: photo.uri,
          ocrText: text,
        },
      });

    } catch (error) {
      console.error("Failed to capture or scan receipt:", error);
    } finally {
      setIsCapturing(false);
    }
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>
            Loading camera permissions...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>
            Camera access required
          </Text>

          <Text style={styles.permissionText}>
            Enable camera permission to scan your receipts.
          </Text>

          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>
              Grant Access
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Scan Receipt</Text>

          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.cameraWrapper}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            mode="picture"
          />
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            disabled={isCapturing}
          >
            <Text style={styles.captureButtonText}>
              {isCapturing ? "Scanning..." : "Capture Receipt"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    minWidth: 56,
  },
  backButtonText: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "600",
  },
  topBarSpacer: {
    minWidth: 56,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  cameraWrapper: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    backgroundColor: "#020617",
  },
  camera: {
    flex: 1,
  },
  bottomBar: {
    marginTop: 16,
  },
  captureButton: {
    backgroundColor: "#16A34A",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  captureButtonText: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
  cancelButtonText: {
    color: "#CBD5E1",
    fontSize: 15,
    fontWeight: "600",
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  permissionTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "700",
  },
  permissionText: {
    marginTop: 8,
    color: "#94A3B8",
    fontSize: 15,
    textAlign: "center",
  },
  permissionButton: {
    marginTop: 18,
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  permissionButtonText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
  },
});