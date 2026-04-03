import ImageViewerModal from "@/components/ImageViewerModal";
import ScreenBackground from "@/components/ScreenBackground";
import { getShadow } from "@/constants/shadowUtils";
import {
    BorderRadius,
    Colors,
    FontWeight,
    Gradients,
    Shadow,
    Spacing,
    TypographyScale,
} from "@/constants/theme";
import { getBOLById } from "@/lib/bolService";
import type { BOLRecord } from "@/lib/types";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatCurrency(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

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

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "—"}</Text>
    </View>
  );
}

export default function BOLDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(true);
  const [bol, setBol] = useState<BOLRecord | null>(null);
  const [error, setError] = useState<string>("");
  const [imageViewerUri, setImageViewerUri] = useState<string | null>(null);

  const loadBOL = useCallback(async () => {
    const rawId = params.id;
    const id = Number(rawId);

    if (!rawId || Number.isNaN(id)) {
      setError("Invalid BOL ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

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

  if (loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.helperText}>Loading BOL...</Text>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  if (error || !bol) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
          <LinearGradient
            colors={Gradients.bluePrimary}
            style={styles.hero}
          >
            <View style={styles.topBar}>
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Text style={styles.backBtnText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.heroTitle}>BOL</Text>
              <View style={styles.spacer} />
            </View>
          </LinearGradient>

          <View style={styles.card}>
            <View style={styles.centerContent}>
              <Text style={styles.emptyIcon}>📄</Text>
              <Text style={styles.emptyTitle}>Unable to open BOL</Text>
              <Text style={styles.emptySubtitle}>{error || "Not found."}</Text>
            </View>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <View style={styles.container}>
          {/* HERO */}
          <LinearGradient
            colors={Gradients.bluePrimary}
            style={styles.hero}
          >
            <View style={styles.topBar}>
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Text style={styles.backBtnText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.heroTitle}>BOL</Text>
              <View style={styles.spacer} />
            </View>
          </LinearGradient>

          {/* FLOATING CARD */}
          <View style={styles.card}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.imageCard}>
                {bol.image_uri ? (
                  <TouchableOpacity
                    onPress={() => setImageViewerUri(bol.image_uri || null)}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: bol.image_uri }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderIcon}>🧾</Text>
                    <Text style={styles.imagePlaceholderText}>
                      No BOL image available
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Shipment Info</Text>

                <DetailRow label="Broker" value={bol.broker ?? ""} />
                <DetailRow
                  label="Pickup"
                  value={bol.pickup_location ?? ""}
                />
                <DetailRow
                  label="Delivery"
                  value={bol.delivery_location ?? ""}
                />
                <DetailRow
                  label="Load Amount"
                  value={formatCurrency(bol.load_amount)}
                />
                <DetailRow label="Date" value={formatDate(bol.date)} />
              </View>
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>

      {/* Fullscreen Image Viewer */}
      <ImageViewerModal
        visible={imageViewerUri !== null}
        uri={imageViewerUri}
        onClose={() => setImageViewerUri(null)}
        title="BOL Image"
      />
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
  },
  hero: {
    paddingTop: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtnText: {
    fontSize: 28,
    color: Colors.textInverse,
    fontWeight: FontWeight.bold,
    lineHeight: 30,
  },
  heroTitle: {
    fontSize: TypographyScale.title.fontSize,
    lineHeight: TypographyScale.title.lineHeight,
    fontWeight: TypographyScale.title.fontWeight,
    color: Colors.textInverse,
  },
  spacer: {
    width: 28,
  },
  card: {
    flex: 1,
    marginTop: -Spacing.xl,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    ...getShadow(Shadow.large),
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
    gap: Spacing.lg,
  },
  imageCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...getShadow(Shadow.small),
  },
  image: {
    width: "100%",
    height: 280,
    backgroundColor: Colors.surface,
  },
  imagePlaceholder: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
  },
  imagePlaceholderIcon: {
    fontSize: 42,
  },
  imagePlaceholderText: {
    fontSize: TypographyScale.body.fontSize,
    lineHeight: TypographyScale.body.lineHeight,
    fontWeight: TypographyScale.body.fontWeight,
    color: Colors.textMuted,
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...getShadow(Shadow.small),
  },
  sectionTitle: {
    fontSize: TypographyScale.subtitle.fontSize,
    lineHeight: TypographyScale.subtitle.lineHeight,
    fontWeight: TypographyScale.subtitle.fontWeight,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: TypographyScale.small.fontSize,
    lineHeight: TypographyScale.small.lineHeight,
    fontWeight: TypographyScale.small.fontWeight,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  detailValue: {
    fontSize: TypographyScale.body.fontSize,
    lineHeight: TypographyScale.body.lineHeight,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  helperText: {
    fontSize: TypographyScale.body.fontSize,
    lineHeight: TypographyScale.body.lineHeight,
    color: Colors.textMuted,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: TypographyScale.subtitle.fontSize,
    lineHeight: TypographyScale.subtitle.lineHeight,
    fontWeight: TypographyScale.subtitle.fontWeight,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: TypographyScale.body.fontSize,
    lineHeight: TypographyScale.body.lineHeight,
    color: Colors.textMuted,
    textAlign: "center",
  },
});