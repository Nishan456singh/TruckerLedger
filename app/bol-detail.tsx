import ImageViewerModal from "@/components/ImageViewerModal";
import ScreenBackground from "@/components/ScreenBackground";

import { getBOLById } from "@/lib/bolService";
import { formatCurrency } from "@/lib/formatUtils";
import type { BOLRecord } from "@/lib/types";

import { router, useLocalSearchParams } from "expo-router";
import * as MediaLibrary from "expo-media-library";

import { useCallback, useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

/* ---------------- DATE FORMAT ---------------- */

function formatDate(date?: string | null): string {
  if (!date) return "—";

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ---------------- DETAIL ROW ---------------- */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || "—"}</Text>
    </View>
  );
}

/* ---------------- SCREEN ---------------- */

export default function BOLDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();

  const [loading, setLoading] = useState(true);
  const [bol, setBol] = useState<BOLRecord | null>(null);
  const [error, setError] = useState("");
  const [imageViewerUri, setImageViewerUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadBOL = useCallback(async () => {
    const id = Number(params.id);

    if (!params.id || Number.isNaN(id)) {
      setError("Invalid BOL ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const result = await getBOLById(id);

      if (!result) {
        setError("BOL not found.");
        setBol(null);
        return;
      }

      setBol(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load BOL.";
      setError(message);
      setBol(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadBOL();
  }, [loadBOL]);

  /* ---------- Save Image to Device ---------- */

  const handleSaveImage = useCallback(async () => {
    if (!bol?.image_uri) {
      Alert.alert("No image", "This BOL doesn't have an image to save.");
      return;
    }

    try {
      setSaving(true);

      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Allow access to your photo library to save images."
        );
        return;
      }

      await MediaLibrary.saveToLibraryAsync(bol.image_uri);
      Alert.alert("Saved!", "BOL image saved to your device.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save image";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  }, [bol?.image_uri]);

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4F8CFF" />
            <Text style={styles.loadingText}>Loading shipment...</Text>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  /* ---------------- ERROR ---------------- */

  if (error || !bol) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe}>
          <View style={styles.center}>
            <Text style={styles.errorIcon}>📄</Text>
            <Text style={styles.errorTitle}>Unable to open BOL</Text>
            <Text style={styles.errorText}>{error || "Not found."}</Text>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <ScreenBackground>
      <LinearGradient
        colors={["#05060A", "#0E1016", "#181A21"]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safe}>
          {/* HEADER */}

          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Bill of Lading</Text>

            <View style={{ width: 30 }} />
          </View>

          {/* CONTENT */}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {/* IMAGE */}

            <View style={styles.imageCard}>
              {bol.image_uri && !imageError ? (
                <>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setImageViewerUri(bol.image_uri)}
                  >
                    <Image
                      source={{ uri: bol.image_uri }}
                      style={styles.image}
                      resizeMode="cover"
                      onError={() => setImageError(true)}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveImage}
                    disabled={saving}
                  >
                    <Text style={styles.saveButtonIcon}>💾</Text>
                    <Text style={styles.saveButtonText}>
                      {saving ? "Saving..." : "Save Image"}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imageIcon}>🧾</Text>
                  <Text style={styles.imageText}>
                    {imageError ? "Image not found" : "No BOL image"}
                  </Text>
                </View>
              )}
            </View>

            {/* INFO */}

            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Shipment Details</Text>

              <DetailRow label="Broker" value={bol.broker ?? ""} />
              <DetailRow label="Pickup" value={bol.pickup_location ?? ""} />
              <DetailRow label="Delivery" value={bol.delivery_location ?? ""} />
              <DetailRow
                label="Load Amount"
                value={formatCurrency(bol.load_amount ?? 0)}
              />
              <DetailRow label="Date" value={formatDate(bol.date)} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* IMAGE VIEWER */}

      <ImageViewerModal
        visible={imageViewerUri !== null}
        uri={imageViewerUri}
        onClose={() => setImageViewerUri(null)}
        title="BOL Image"
      />
    </ScreenBackground>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  safe: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  back: {
    fontSize: 32,
    color: "#FFFFFF",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  content: {
    padding: 24,
    gap: 20,
  },

  imageCard: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  image: {
    width: "100%",
    height: 280,
  },

  imagePlaceholder: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },

  imageIcon: {
    fontSize: 42,
    marginBottom: 8,
  },

  imageText: {
    color: "rgba(255,255,255,0.6)",
  },

  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "rgba(79, 140, 255, 0.15)",
    borderTopWidth: 1,
    borderTopColor: "rgba(79, 140, 255, 0.2)",
  },

  saveButtonIcon: {
    fontSize: 18,
  },

  saveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4F8CFF",
  },

  infoCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 20,
    borderRadius: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },

  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  rowLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 4,
  },

  rowValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "rgba(255,255,255,0.6)",
  },

  errorIcon: {
    fontSize: 48,
    marginBottom: 10,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  errorText: {
    marginTop: 8,
    color: "rgba(255,255,255,0.6)",
  },

  backButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#4F8CFF",
    borderRadius: 10,
  },

  backButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
});