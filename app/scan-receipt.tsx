import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from "@/constants/theme";
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

      router.push({
        pathname: "/add-expense",
        params: {
          receiptUri: photo.uri,
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
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  backButton: {
    minWidth: 56,
  },
  backButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
  },
  topBarSpacer: {
    minWidth: 56,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.section + 2,
    fontWeight: FontWeight.bold,
    textAlign: "center",
  },
  cameraWrapper: {
    flex: 1,
    overflow: "hidden",
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cardStrong,
  },
  camera: {
    flex: 1,
  },
  bottomBar: {
    marginTop: Spacing.lg,
  },
  captureButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonText: {
    color: Colors.background,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
  cancelButton: {
    marginTop: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.card,
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  permissionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
  },
  permissionText: {
    marginTop: Spacing.sm,
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    textAlign: "center",
  },
  permissionButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    minHeight: 52,
    minWidth: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  permissionButtonText: {
    color: Colors.background,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
});