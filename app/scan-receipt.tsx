import {
  BorderRadius,
  Colors,
  FontSize,
  FontWeight,
  Shadow,
  Spacing,
} from "@/constants/theme";

import { addExpense } from "@/lib/expenseService";

import { CameraView, useCameraPermissions } from "expo-camera";
import { Directory, File, Paths } from "expo-file-system";

import * as Haptics from "expo-haptics";

import { router } from "expo-router";

import React, { useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export default function ScanReceiptScreen() {
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] = useCameraPermissions();
  const [captured, setCaptured] = useState(false);
  const [saving, setSaving] = useState(false);

  const cameraRef = useRef<CameraView>(null);

  const flashScale = useSharedValue(0);
  const shutterScale = useSharedValue(1);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashScale.value,
  }));

  const shutterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  async function handleCapture() {
    if (!cameraRef.current || captured) return;

    shutterScale.value = withSequence(
      withTiming(0.9, { duration: 80 }),
      withTiming(1, { duration: 120 })
    );

    flashScale.value = withSequence(
      withTiming(0.7, { duration: 60 }),
      withTiming(0, { duration: 200 })
    );

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setCaptured(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });

      if (!photo?.uri) {
        setCaptured(false);
        return;
      }

      setSaving(true);

      // ─── Create receipts directory ─────────────────────

      const receiptsDir = new Directory(Paths.document, "receipts");

    if (!receiptsDir.exists) {
  await receiptsDir.create({ intermediates: true });
}

      const filename = `receipt_${Date.now()}.jpg`;

      const sourceFile = new File(photo.uri);
      const destFile = new File(receiptsDir, filename);

      await sourceFile.copy(destFile);

      const destUri = destFile.uri;

      // ─── Create expense record ─────────────────────

      const today = new Date().toISOString().split("T")[0];

      const id = await addExpense({
        amount: 0,
        category: "other",
        note: "Scanned receipt — tap to edit",
        date: today,
        receipt_uri: destUri,
      });

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      router.replace({
        pathname: "/expense-detail",
        params: { id, fromScan: "1" },
      });
    } catch (err) {
      console.error(err);

      Alert.alert(
        "Error",
        "Failed to save receipt. Please try again."
      );

      setCaptured(false);
      setSaving(false);
    }
  }

  if (!permission) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>

          <Text style={styles.permissionTitle}>
            Camera Access Needed
          </Text>

          <Text style={styles.permissionDesc}>
            TruckerLedger needs camera access to scan receipts.
          </Text>

          <TouchableOpacity
            style={styles.permissionBtn}
            onPress={requestPermission}
          >
            <Text style={styles.permissionBtnText}>
              Allow Camera Access
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.cancelLink}
          >
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
      />

      <Animated.View
        style={[StyleSheet.absoluteFill, styles.flashOverlay, flashStyle]}
        pointerEvents="none"
      />

      <Animated.View
        entering={FadeIn.duration(400)}
        style={styles.viewfinderWrapper}
        pointerEvents="none"
      >
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        <Text style={styles.hint}>
          Position receipt within the frame
        </Text>
      </Animated.View>

      <SafeAreaView style={styles.topBar}>
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={styles.topBarContent}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.topBarBtn}
          >
            <Text style={styles.topBarBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.screenTitle}>Scan Receipt</Text>

          <View style={{ width: 40 }} />
        </Animated.View>
      </SafeAreaView>

      <Animated.View
        entering={FadeInDown.delay(200)}
        style={[
          styles.shutterContainer,
          { bottom: 20 + insets.bottom },
        ]}
      >
        {saving ? (
          <ActivityIndicator
            size="large"
            color={Colors.textPrimary}
          />
        ) : (
          <Animated.View style={shutterStyle}>
            <TouchableOpacity
              style={styles.shutterOuter}
              onPress={handleCapture}
              activeOpacity={0.9}
              disabled={captured}
            >
              <View style={styles.shutterInner} />
            </TouchableOpacity>
          </Animated.View>
        )}

        <Text style={styles.shutterLabel}>
          {saving ? "Saving receipt…" : "Tap to capture"}
        </Text>
      </Animated.View>
    </View>
  );
}

const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },

  safe: { flex: 1, backgroundColor: Colors.background },

  flashOverlay: { backgroundColor: "#fff" },

  viewfinderWrapper: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xl,
  },

  viewfinder: { width: 280, height: 380 },

  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: Colors.accent,
  },

  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },

  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },

  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },

  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },

  hint: {
    fontSize: FontSize.caption,
    color: "rgba(255,255,255,0.7)",
  },

  topBar: { position: "absolute", top: 0, left: 0, right: 0 },

  topBarContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },

  topBarBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  topBarBtnText: { color: "#fff", fontWeight: FontWeight.semibold },

  screenTitle: { color: "#fff", fontWeight: FontWeight.bold },

  shutterContainer: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
  },

  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#fff",
  },

  shutterLabel: {
    marginTop: 10,
    color: "rgba(255,255,255,0.8)",
  },

  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
  },

  permissionIcon: { fontSize: 56 },

  permissionTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    textAlign: "center",
  },

  permissionDesc: {
    textAlign: "center",
    color: Colors.textSecondary,
    marginVertical: 10,
  },

  permissionBtn: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: BorderRadius.full,
    marginTop: 20,
    ...Shadow.button,
  },

  permissionBtnText: { color: "#fff", fontWeight: FontWeight.bold },

  cancelLink: { marginTop: 10 },

  cancelLinkText: { color: Colors.textSecondary },
});