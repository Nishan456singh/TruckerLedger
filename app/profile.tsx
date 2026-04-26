import PrimaryButton from "@/components/PrimaryButton";
import ScreenBackground from "@/components/ScreenBackground";
import { getShadow } from "@/constants/shadowUtils";
import {
    BorderRadius,
    FontSize,
    FontWeight,
    Shadow,
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
import { formatCurrency } from "@/lib/formatUtils";
import { exportTrips, getTripCount } from "@/lib/tripService";

import * as FileSystem from "expo-file-system/legacy";
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

  useFocusEffect(
    useCallback(() => {
      loadStats().catch(console.error);
    }, [loadStats])
  );

  /* ---------------- EXPORT ---------------- */

  async function shareCSV(name: string, csv: string) {
    try {
      const cacheDir =
        (FileSystem as any).cacheDirectory ||
        (FileSystem as any).documentDirectory;

      if (!cacheDir) {
        Alert.alert(
          "Storage Not Available",
          "Unable to access device storage for export. Please try again."
        );
        return;
      }

      const fileUri = `${cacheDir}${name}_${Date.now()}.csv`;

      await FileSystem.writeAsStringAsync(fileUri, csv);

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Not Available", "Sharing not supported on this device.");
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
      });
    } catch (err) {
      console.error("[Export Error]:", err);
      const message =
        err instanceof Error ? err.message : "Failed to export data";
      Alert.alert("Export Failed", message);
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
      console.error(err);
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
      <SafeAreaView style={styles.safe} edges={["top","left","right","bottom"]}>
        <LinearGradient
          colors={["#0F1116", "#171A22", "#1F2430"]}
          style={styles.container}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>

            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* USER */}
          <View style={styles.hero}>
            {user.photo ? (
              <Image source={{ uri: user.photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>
                  {user.name?.[0] ?? "U"}
                </Text>
              </View>
            )}

            <Text style={styles.name}>{user.name}</Text>

            <Text style={styles.provider}>
              Connected via {provider}
            </Text>
          </View>

          {/* CONTENT */}
          <View style={styles.card}>
            <ScrollView contentContainerStyle={styles.content}>
              {/* STATS */}
              <Animated.View entering={FadeInDown}>
                <Text style={styles.sectionTitle}>Overview</Text>

                <View style={styles.statsGrid}>
                  <StatCard label="Total" value={formatCurrency(stats.total)} />
                  <StatCard label="This Month" value={formatCurrency(stats.month)} />
                  <StatCard label="Receipts" value={String(stats.receipts)} />
                  <StatCard label="Trips" value={String(stats.trips)} />
                </View>
              </Animated.View>

              {/* TOOLS */}
              <Animated.View entering={FadeInDown.delay(120)}>
                <Text style={styles.sectionTitle}>Tools</Text>

                <View style={styles.grid}>
                  <Tool label="Expenses" icon="📋" onPress={() => handleExport("expenses")} />
                  <Tool label="Trips" icon="🚚" onPress={() => handleExport("trips")} />
                  <Tool label="BOLs" icon="📦" onPress={() => handleExport("bols")} />
                  <Tool label="Reports" icon="📊" onPress={() => router.push("/monthly-report")} />
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(180)}>
                <Text style={styles.sectionTitle}>Legal</Text>

                <View style={styles.grid}>
                  <Tool
                    label="Terms"
                    icon="📄"
                    onPress={() => router.push("/legal/terms")}
                  />
                  <Tool
                    label="Privacy"
                    icon="🔒"
                    onPress={() => router.push("/legal/privacy")}
                  />
                </View>
              </Animated.View>
            </ScrollView>

            {/* FOOTER */}
            <View style={styles.footer}>
              <PrimaryButton
                label="Sign Out"
                onPress={handleLogout}
                fullWidth
              />
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </ScreenBackground>
  );
}

/* ---------------- COMPONENTS ---------------- */

type StatCardProps = {
  label: string;
  value: string;
};

type ToolProps = {
  label: string;
  icon: string;
  onPress: () => void;
};

function StatCard({ label, value }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Tool({ label, icon, onPress }: ToolProps) {
  return (
    <TouchableOpacity style={styles.tool} onPress={onPress}>
      <Text style={styles.toolIcon}>{icon}</Text>
      <Text style={styles.toolText}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({

safe:{ flex:1 },

container:{ flex:1 },

header:{
paddingTop:Spacing.lg,
paddingHorizontal:Spacing.lg,
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center"
},

headerTitle:{
color:"#fff",
fontSize:20,
fontWeight:FontWeight.bold
},

close:{
color:"#aaa",
fontSize:22
},

hero:{
alignItems:"center",
paddingVertical:Spacing.xl
},

avatar:{
width:90,
height:90,
borderRadius:45
},

avatarFallback:{
width:90,
height:90,
borderRadius:45,
backgroundColor:"rgba(255,255,255,0.1)",
alignItems:"center",
justifyContent:"center"
},

avatarText:{
fontSize:32,
color:"#fff",
fontWeight:"bold"
},

name:{
color:"#fff",
fontSize:22,
fontWeight:"700",
marginTop:10
},

provider:{
color:"#aaa",
marginTop:4
},

card:{
flex:1,
backgroundColor:"#14171F",
borderTopLeftRadius:BorderRadius.xl,
borderTopRightRadius:BorderRadius.xl,
...getShadow(Shadow.large)
},

content:{
padding:Spacing.lg,
gap:Spacing.xl
},

sectionTitle:{
fontSize:FontSize.subsection,
fontWeight:FontWeight.bold,
color:"#fff",
marginBottom:Spacing.md
},

statsGrid:{
flexDirection:"row",
flexWrap:"wrap",
gap:Spacing.md
},

statCard:{
width:"48%",
backgroundColor:"#1C202B",
padding:Spacing.lg,
borderRadius:BorderRadius.lg,
},

statLabel:{
color:"#8C93A8",
fontSize:12,
marginBottom:4
},

statValue:{
color:"#fff",
fontSize:18,
fontWeight:"700"
},

grid:{
flexDirection:"row",
flexWrap:"wrap",
gap:Spacing.md
},

tool:{
width:"48%",
backgroundColor:"#1C202B",
paddingVertical:Spacing.lg,
borderRadius:BorderRadius.lg,
alignItems:"center"
},

toolIcon:{
fontSize:30,
marginBottom:Spacing.sm
},

toolText:{
color:"#fff",
fontWeight:"600"
},

footer:{
padding:Spacing.lg
}

});