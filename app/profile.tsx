import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
} from "@/constants/theme";
import ScreenBackground from "@/components/ScreenBackground";
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
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarFallbackText}>{initials}</Text>
    </View>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>
        {icon} {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.identityCard}>
          {user.photo && !photoError ? (
            <Image
              source={{ uri: user.photo }}
              style={styles.avatar}
              contentFit="cover"
              onError={() => setPhotoError(true)}
            />
          ) : (
            <AvatarInitials name={user.name} />
          )}

          <View style={styles.identityTextWrap}>
            <Text style={styles.name}>{user.name}</Text>
            {!!user.email && <Text style={styles.email}>{user.email}</Text>}
          </View>
        </View>

        <SectionCard title="Driver Stats" icon="📊">
          <Row label="Total Expenses" value={formatCurrency(totalExpenses)} />
          <Row label="This Month" value={formatCurrency(thisMonth)} />
          <Row label="Receipts Scanned" value={String(receiptsScanned)} />
          <Row label="Trips Logged" value={String(tripsLogged)} />
        </SectionCard>

        <SectionCard title="Tools" icon="🧰">
          <TouchableOpacity onPress={handleExportCsv} style={styles.toolBtn}>
            <Text style={styles.toolBtnText}>
              {exportingExpenses ? "Exporting..." : "Export Expenses (CSV)"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleExportTrips} style={styles.toolBtn}>
            <Text style={styles.toolBtnText}>
              {exportingTrips ? "Exporting..." : "Export Trips (CSV)"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleExportBOLs} style={styles.toolBtn}>
            <Text style={styles.toolBtnText}>
              {exportingBOLs ? "Exporting..." : "Export BOLs (CSV)"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/monthly-report")}
            style={styles.toolBtn}
          >
            <Text style={styles.toolBtnText}>Monthly Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/trip-profit")}
            style={styles.toolBtn}
          >
            <Text style={styles.toolBtnText}>Trip Profit Calculator</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/receipts")}
            style={styles.toolBtn}
          >
            <Text style={styles.toolBtnText}>Receipt Gallery</Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard title="Account" icon="🔐">
          <Row label="Email" value={user.email || "-"} />
          <Row label="Account ID" value={user.id.slice(0, 16) + "..."} />
          <Row label="Provider" value={displayProvider} />
        </SectionCard>

        <TouchableOpacity
          onPress={() => router.push("/cloud-settings")}
          style={styles.toolBtn}
        >
          <Text style={styles.toolBtnText}>⚙️ Cloud Settings & Backup</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    fontSize: 28,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  headerTitle: {
    fontSize: FontSize.section,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  identityCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    ...Shadow.card,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.primary + "60",
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + "25",
    borderWidth: 2,
    borderColor: Colors.primary + "60",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  identityTextWrap: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.section - 2,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  email: {
    marginTop: 2,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  cardTitle: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs + 2,
  },
  rowLabel: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
  },
  rowValue: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semibold,
    maxWidth: "55%",
    textAlign: "right",
  },
  toolBtn: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  toolBtnText: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
  logoutBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.danger + "1F",
    borderWidth: 1,
    borderColor: Colors.danger + "55",
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtnText: {
    fontSize: FontSize.body,
    color: Colors.danger,
    fontWeight: FontWeight.bold,
  },
});
