import PrimaryButton from "@/components/PrimaryButton";
import ScreenBackground from "@/components/ScreenBackground";
import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Spacing
} from "@/constants/theme";
import { useAuth } from "@/lib/auth/AuthContext";
import { exportBOLs } from "@/lib/bolService";
import {
    exportExpenses,
    getAllExpenses,
    getDashboardStats,
    getReceiptCount,
} from "@/lib/expenseService";
import { exportTrips, getTripCount } from "@/lib/tripService";
import { File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useMemo, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <View style={styles.heroAvatarFallback}>
      <Text style={styles.heroAvatarFallbackText}>{initials}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [photoError, setPhotoError] = useState(false);

  const [totalExpenses, setTotalExpenses] = useState(0);
  const [thisMonth, setThisMonth] = useState(0);
  const [receiptsScanned, setReceiptsScanned] = useState(0);
  const [tripsLogged, setTripsLogged] = useState(0);

  const [exportingExpenses, setExportingExpenses] = useState(false);
  const [exportingTrips, setExportingTrips] = useState(false);
  const [exportingBOLs, setExportingBOLs] = useState(false);

  const displayProvider = useMemo(
    () => (user?.provider === "apple" ? "Apple" : "Google"),
    [user?.provider]
  );

  const loadStats = useCallback(async () => {
    const [all, dashboard, receiptCount, tripCount] = await Promise.all([
      getAllExpenses(),
      getDashboardStats(),
      getReceiptCount(),
      getTripCount(),
    ]);

    const allTotal = all.reduce((sum, expense) => sum + expense.amount, 0);

    setTotalExpenses(allTotal);
    setThisMonth(dashboard.monthTotal);
    setReceiptsScanned(receiptCount);
    setTripsLogged(tripCount);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats().catch(console.error);
    }, [loadStats])
  );

  async function handleExportCsv() {
    if (exportingExpenses) return;

    setExportingExpenses(true);

    try {
      const csv = await exportExpenses();

      if (!csv || csv.trim() === "Date,Category,Amount,Note") {
        Alert.alert("No Data", "You have no expenses to export yet.");
        return;
      }

      const shareAvailable = await Sharing.isAvailableAsync();
      if (!shareAvailable) {
        Alert.alert("Not Available", "Sharing is not available on this device.");
        return;
      }

      const file = new File(Paths.cache, `truckledger_expenses_${Date.now()}.csv`);
      await file.write(csv);

      await Sharing.shareAsync(file.uri, {
        mimeType: "text/csv",
        dialogTitle: "Export Expenses",
        UTI: "public.comma-separated-values-text",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to export expenses.";
      Alert.alert("Export Failed", message);
    } finally {
      setExportingExpenses(false);
    }
  }

  async function handleExportTrips() {
    if (exportingTrips) return;

    setExportingTrips(true);

    try {
      const csv = await exportTrips();

      if (!csv || csv.trim() === "Date,Income,Fuel,Tolls,Food,Parking,Repairs,Other,Total Expenses,Profit,Note") {
        Alert.alert("No Data", "You have no trips to export yet.");
        return;
      }

      const shareAvailable = await Sharing.isAvailableAsync();
      if (!shareAvailable) {
        Alert.alert("Not Available", "Sharing is not available on this device.");
        return;
      }

      const file = new File(Paths.cache, `truckledger_trips_${Date.now()}.csv`);
      await file.write(csv);

      await Sharing.shareAsync(file.uri, {
        mimeType: "text/csv",
        dialogTitle: "Export Trips",
        UTI: "public.comma-separated-values-text",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to export trips.";
      Alert.alert("Export Failed", message);
    } finally {
      setExportingTrips(false);
    }
  }

  async function handleExportBOLs() {
    if (exportingBOLs) return;

    setExportingBOLs(true);

    try {
      const csv = await exportBOLs();

      if (!csv || csv.trim() === "Date,Broker,Pickup Location,Delivery Location,Load Amount") {
        Alert.alert("No Data", "You have no BOLs to export yet.");
        return;
      }

      const shareAvailable = await Sharing.isAvailableAsync();
      if (!shareAvailable) {
        Alert.alert("Not Available", "Sharing is not available on this device.");
        return;
      }

      const file = new File(Paths.cache, `truckledger_bols_${Date.now()}.csv`);
      await file.write(csv);

      await Sharing.shareAsync(file.uri, {
        mimeType: "text/csv",
        dialogTitle: "Export BOLs",
        UTI: "public.comma-separated-values-text",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to export BOLs.";
      Alert.alert("Export Failed", message);
    } finally {
      setExportingBOLs(false);
    }
  }

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  if (!user) return null;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <View style={styles.container}>
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* HERO SECTION (45% - Blue/Profile themed)                       */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          <LinearGradient
            colors={[Colors.secondary, '#5A8FB5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroSection}
          >
            {/* Top Bar */}
            <View style={styles.heroTopBar}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.heroBackBtn}
              >
                <Text style={styles.heroBackText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.heroTitle}>Profile</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Centered User Info */}
            <View style={styles.heroUserCenter}>
              {user.photo && !photoError ? (
                <Image
                  source={{ uri: user.photo }}
                  style={styles.heroAvatar}
                  contentFit="cover"
                  onError={() => setPhotoError(true)}
                />
              ) : (
                <AvatarInitials name={user.name} />
              )}

              <Text style={styles.heroUserName}>{user.name}</Text>
              <Text style={styles.heroUserSubtitle}>{displayProvider} Account</Text>
            </View>
          </LinearGradient>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* FLOATING CARD (55%+ - Sections & Actions)                      */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          <View style={styles.floatingCardContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.cardContent}
            >
              {/* Driver Stats Section */}
              <Animated.View entering={FadeInDown}>
                <Text style={styles.cardSectionTitle}>📊 Driver Stats</Text>
                <View style={styles.statsBlock}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Expenses</Text>
                    <Text style={styles.statValue}>{formatCurrency(totalExpenses)}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>This Month</Text>
                    <Text style={styles.statValue}>{formatCurrency(thisMonth)}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Receipts Scanned</Text>
                    <Text style={styles.statValue}>{receiptsScanned}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Trips Logged</Text>
                    <Text style={styles.statValue}>{tripsLogged}</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Tools Section */}
              <Animated.View entering={FadeInDown.delay(50)}>
                <Text style={styles.cardSectionTitle}>🧰 Tools</Text>
                <View style={styles.toolsGrid}>
                  <TouchableOpacity
                    onPress={handleExportCsv}
                    style={styles.toolButton}
                    disabled={exportingExpenses}
                  >
                    <Text style={styles.toolIcon}>📋</Text>
                    <Text style={styles.toolLabel}>
                      {exportingExpenses ? "Exporting..." : "Export Expenses"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleExportTrips}
                    style={styles.toolButton}
                    disabled={exportingTrips}
                  >
                    <Text style={styles.toolIcon}>🚚</Text>
                    <Text style={styles.toolLabel}>
                      {exportingTrips ? "Exporting..." : "Export Trips"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleExportBOLs}
                    style={styles.toolButton}
                    disabled={exportingBOLs}
                  >
                    <Text style={styles.toolIcon}>📦</Text>
                    <Text style={styles.toolLabel}>
                      {exportingBOLs ? "Exporting..." : "Export BOLs"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push("/monthly-report")}
                    style={styles.toolButton}
                  >
                    <Text style={styles.toolIcon}>📈</Text>
                    <Text style={styles.toolLabel}>Monthly Report</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push("/trip-profit")}
                    style={styles.toolButton}
                  >
                    <Text style={styles.toolIcon}>💰</Text>
                    <Text style={styles.toolLabel}>Trip Profit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push("/receipts")}
                    style={styles.toolButton}
                  >
                    <Text style={styles.toolIcon}>📸</Text>
                    <Text style={styles.toolLabel}>Receipts</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Account Section */}
              <Animated.View entering={FadeInDown.delay(100)}>
                <Text style={styles.cardSectionTitle}>🔐 Account</Text>
                <View style={styles.accountBlock}>
                  <View style={styles.accountRow}>
                    <Text style={styles.accountLabel}>Email</Text>
                    <Text style={styles.accountValue}>{user.email || "-"}</Text>
                  </View>
                  <View style={styles.accountDivider} />
                  <View style={styles.accountRow}>
                    <Text style={styles.accountLabel}>Provider</Text>
                    <Text style={styles.accountValue}>{displayProvider}</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Cloud Settings Button */}
              <Animated.View entering={FadeInDown.delay(150)}>
                <TouchableOpacity
                  onPress={() => router.push("/cloud-settings")}
                  style={styles.settingsButton}
                >
                  <Text style={styles.settingsIcon}>⚙️</Text>
                  <Text style={styles.settingsLabel}>Cloud Settings & Backup</Text>
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>

            {/* Logout Button */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.cardFooter}>
              <PrimaryButton
                label="🚪 Sign Out"
                variant="danger"
                onPress={handleLogout}
                fullWidth
              />
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
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
    position: "relative",
  },

  // ─── HERO SECTION ───────────────────────────────────────────

  heroSection: {
    flex: 0.45,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.md,
    justifyContent: "space-between",
  },

  heroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroBackBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  heroBackText: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  heroTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  heroUserCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },

  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },

  heroAvatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroAvatarFallbackText: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  heroUserName: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.extrabold,
    color: Colors.textInverse,
  },

  heroUserSubtitle: {
    fontSize: FontSize.body,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: FontWeight.medium,
  },

  // ─── FLOATING CARD ──────────────────────────────────────────

  floatingCardContainer: {
    flex: 0.55,
    marginTop: -Spacing.lg,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: 32,
    overflow: "hidden",
    ...{
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 10,
    },
  },

  cardContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.lg,
  },

  cardSectionTitle: {
    fontSize: FontSize.subsection,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // ─── STATS SECTION ───────────────────────────────────────────

  statsBlock: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 0,
    overflow: "hidden",
  },

  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  statLabel: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  statValue: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },

  statDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },

  // ─── TOOLS GRID ──────────────────────────────────────────

  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },

  toolButton: {
    width: "48%",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.lg,
  },

  toolIcon: {
    fontSize: 28,
  },

  toolLabel: {
    fontSize: FontSize.caption,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    textAlign: "center",
  },

  // ─── ACCOUNT SECTION ────────────────────────────────────────

  accountBlock: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 0,
    overflow: "hidden",
  },

  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  accountLabel: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  accountValue: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    maxWidth: "50%",
    textAlign: "right",
  },

  accountDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },

  // ─── SETTINGS BUTTON ────────────────────────────────────────

  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  settingsIcon: {
    fontSize: 22,
  },

  settingsLabel: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
  },

  // ─── FOOTER ──────────────────────────────────────────────────

  cardFooter: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
