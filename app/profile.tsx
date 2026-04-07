
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
} from "@/constants/theme";

import { useAuth } from "@/lib/auth/AuthContext";
import { exportBOLs } from "@/lib/bolService";
import {
    exportExpenses,
    getAllExpenses,
    getDashboardStats,
    getReceiptCount,
} from "@/lib/expenseService";
import { formatCurrency } from "@/lib/formatUtils";
import { exportTrips, getTripCount } from "@/lib/tripService";

import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";

import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";

import { useCallback, useMemo, useState } from "react";
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

/* ---------------- MAIN ---------------- */

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const [stats, setStats] = useState({
    total: 0,
    month: 0,
    receipts: 0,
    trips: 0,
  });

  const provider = useMemo(
    () => (user?.provider === "apple" ? "Apple" : "Google"),
    [user]
  );

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

  useFocusEffect(useCallback(() => {
    loadStats().catch(console.error);
  }, [loadStats]));

  /* ---------------- EXPORT ---------------- */

  async function shareCSV(name: string, csv: string) {
    try {
      const cacheDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || "";
      const fileUri = `${cacheDir}${name}_${Date.now()}.csv`;

      await FileSystem.writeAsStringAsync(fileUri, csv);

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Not Available", "Sharing not supported.");
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
      });
    } catch (err) {
      console.error("Export error:", err);
      Alert.alert("Export Failed");
    }
  }

  async function handleExport(type: "expenses" | "trips" | "bols") {
    try {
      let csv = "";

      if (type === "expenses") csv = await exportExpenses();
      if (type === "trips") csv = await exportTrips();
      if (type === "bols") csv = await exportBOLs();

      await shareCSV(`truckledger_${type}`, csv);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error("Export export error:", err);
    }
  }

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
      <SafeAreaView style={styles.safe} edges={["left","right","bottom"]}>
        <LinearGradient
          colors={[Colors.secondary, "#5A8FB5"]}
          style={styles.container}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Profile</Text>

            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* USER */}
          <View style={styles.heroContent}>
            {user.photo ? (
              <Image source={{ uri: user.photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>
                  {user.name[0]}
                </Text>
              </View>
            )}

            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.subtitle}>{provider} Account</Text>
          </View>

          {/* FLOATING CARD */}
          <View style={styles.card}>
            <ScrollView contentContainerStyle={styles.content}>
              {/* STATS */}
              <Animated.View entering={FadeInDown}>
                <Text style={styles.sectionTitle}>Stats</Text>

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
              <Animated.View entering={FadeInDown.delay(100)}>
                <Text style={styles.sectionTitle}>Tools</Text>

                <View style={styles.grid}>
                  <Tool label="Expenses" icon="📋" onPress={() => handleExport("expenses")} />
                  <Tool label="Trips" icon="🚚" onPress={() => handleExport("trips")} />
                  <Tool label="BOLs" icon="📦" onPress={() => handleExport("bols")} />
                  <Tool label="Reports" icon="📈" onPress={() => router.push("/monthly-report")} />
                </View>
              </Animated.View>
            </ScrollView>

            {/* FOOTER */}
            <View style={styles.footer}>
              <PrimaryButton label="Sign Out" onPress={handleLogout} fullWidth />
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </ScreenBackground>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Row({ label, value }: any) {
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

function Tool({ label, icon, onPress }: any) {
  return (
    <TouchableOpacity style={styles.tool} onPress={onPress}>
      <Text style={styles.toolIcon}>{icon}</Text>
      <Text style={styles.toolText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  container: { flex: 1 },

  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  greeting: {
    color: "#fff",
    fontSize: 20,
    fontWeight: FontWeight.bold,
  },

  close: {
    color: "#fff",
    fontSize: 22,
  },

  heroContent: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },

  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },

  name: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
  },

  subtitle: {
    color: "rgba(255,255,255,0.7)",
    marginTop: Spacing.xs,
  },

  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    marginTop: Spacing.xl,
    ...getShadow(Shadow.large),
  },

  content: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },

  sectionTitle: {
    fontSize: FontSize.subsection,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },

  block: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },

  row: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rowLabel: { color: Colors.textMuted, fontSize: 13 },

  rowValue: { fontWeight: "600", fontSize: 15, color: Colors.textPrimary },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    justifyContent: "space-between",
  },

  tool: {
    width: "48%",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  toolIcon: { fontSize: 32, marginBottom: Spacing.sm },

  toolText: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary },

  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
});