// ✅ PROFILE SCREEN — CLEAN + PRODUCTION READY

import PrimaryButton from "@/components/PrimaryButton";
import ScreenBackground from "@/components/ScreenBackground";
import { getShadow } from "@/constants/shadowUtils";
import {
  BorderRadius,
  Colors,
  FontSize,
  FontWeight,
  Shadow,
  Spacing,
  TypographyScale,
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

import * as FileSystem from "expo-file-system"; // ✅ FIXED
import * as Sharing from "expo-sharing";

import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";

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

/* ---------------- HELPERS ---------------- */

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
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
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarFallbackText}>{initials}</Text>
    </View>
  );
}

/* ---------------- MAIN ---------------- */

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const [photoError, setPhotoError] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    month: 0,
    receipts: 0,
    trips: 0,
  });

  const [loadingExport, setLoadingExport] = useState<string | null>(null);

  const provider = useMemo(
    () => (user?.provider === "apple" ? "Apple" : "Google"),
    [user]
  );

  /* ---------------- LOAD ---------------- */

  const loadStats = useCallback(async () => {
    const [all, dashboard, receipts, trips] = await Promise.all([
      getAllExpenses(),
      getDashboardStats(),
      getReceiptCount(),
      getTripCount(),
    ]);

    const total = all.reduce((sum, e) => sum + e.amount, 0);

    setStats({
      total,
      month: dashboard.monthTotal,
      receipts,
      trips,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats().catch(console.error);
    }, [loadStats])
  );

  /* ---------------- EXPORT ---------------- */

  async function shareCSV(name: string, csv: string) {
    const fileUri = FileSystem.cacheDirectory + `${name}_${Date.now()}.csv`;

    await FileSystem.writeAsStringAsync(fileUri, csv);

    await Sharing.shareAsync(fileUri, {
      mimeType: "text/csv",
    });
  }

  async function handleExport(type: "expenses" | "trips" | "bols") {
    if (loadingExport) return;

    setLoadingExport(type);

    try {
      let csv = "";

      if (type === "expenses") csv = await exportExpenses();
      if (type === "trips") csv = await exportTrips();
      if (type === "bols") csv = await exportBOLs();

      if (!csv || csv.length < 20) {
        Alert.alert("No Data", "Nothing to export yet.");
        return;
      }

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Not Available", "Sharing not supported.");
        return;
      }

      await shareCSV(`truckledger_${type}`, csv);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Export Failed");
    } finally {
      setLoadingExport(null);
    }
  }

  /* ---------------- LOGOUT ---------------- */

  function handleLogout() {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  if (!user) return null;

  /* ---------------- UI ---------------- */

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <LinearGradient
          colors={[Colors.secondary, "#5A8FB5"]}
          style={styles.hero}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Profile</Text>

            <View style={{ width: 24 }} />
          </View>

          {/* USER */}
          <View style={styles.userCenter}>
            {user.photo && !photoError ? (
              <Image
                source={{ uri: user.photo }}
                style={styles.avatar}
                onError={() => setPhotoError(true)}
              />
            ) : (
              <AvatarInitials name={user.name} />
            )}

            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.subtitle}>{provider} Account</Text>
          </View>
        </LinearGradient>

        {/* FLOATING CARD */}
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.content}>
            {/* STATS */}
            <Animated.View entering={FadeInDown}>
              <Text style={styles.sectionTitle}>📊 Stats</Text>

              <View style={styles.block}>
                <Row label="Total Expenses" value={formatCurrency(stats.total)} />
                <Divider />
                <Row label="This Month" value={formatCurrency(stats.month)} />
                <Divider />
                <Row label="Receipts" value={String(stats.receipts)} />
                <Divider />
                <Row label="Trips" value={String(stats.trips)} />
              </View>
            </Animated.View>

            {/* TOOLS */}
            <Animated.View entering={FadeInDown.delay(80)}>
              <Text style={styles.sectionTitle}>🧰 Tools</Text>

              <View style={styles.grid}>
                <Tool label="Expenses" icon="📋" onPress={() => handleExport("expenses")} loading={loadingExport === "expenses"} />
                <Tool label="Trips" icon="🚚" onPress={() => handleExport("trips")} loading={loadingExport === "trips"} />
                <Tool label="BOLs" icon="📦" onPress={() => handleExport("bols")} loading={loadingExport === "bols"} />
                <Tool label="Reports" icon="📈" onPress={() => router.push("/monthly-report")} />
              </View>
            </Animated.View>

            {/* ACCOUNT */}
            <Animated.View entering={FadeInDown.delay(120)}>
              <Text style={styles.sectionTitle}>🔐 Account</Text>

              <View style={styles.block}>
                <Row label="Email" value={user.email || "-"} />
                <Divider />
                <Row label="Provider" value={provider} />
              </View>
            </Animated.View>
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <PrimaryButton label="Sign Out" onPress={handleLogout} fullWidth />
          </View>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function Tool({ label, icon, onPress, loading }: any) {
  return (
    <TouchableOpacity style={styles.tool} onPress={onPress}>
      <Text style={styles.toolIcon}>{icon}</Text>
      <Text style={styles.toolText}>
        {loading ? "Loading..." : label}
      </Text>
    </TouchableOpacity>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  hero: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  back: { color: "white", fontSize: 22 },

  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },

  userCenter: {
    alignItems: "center",
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },

  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarFallbackText: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },

  name: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    color: "rgba(255,255,255,0.7)",
  },

  card: {
    flex: 1,
    marginTop: -Spacing.lg,
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },

  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },

  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },

  block: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    ...getShadow(Shadow.small),
  },

  row: {
    padding: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  rowLabel: { color: Colors.textMuted },

  rowValue: { fontWeight: "bold" },

  divider: { height: 1, backgroundColor: Colors.border },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },

  tool: {
    width: "48%",
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    ...getShadow(Shadow.small),
  },

  toolIcon: { fontSize: 26 },

  toolText: { marginTop: 6 },

  footer: {
    padding: Spacing.lg,
  },
});