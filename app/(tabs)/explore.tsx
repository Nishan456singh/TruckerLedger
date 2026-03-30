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
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ───────────── COMPONENTS ───────────── */

function TipCard({
  icon,
  title,
  desc,
  onPress,
}: {
  icon: string;
  title: string;
  desc: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.tipCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <Text style={styles.tipIcon}>{icon}</Text>
      <Text style={styles.tipTitle}>{title}</Text>
      <Text style={styles.tipDesc}>{desc}</Text>
    </TouchableOpacity>
  );
}

function ActionCard({
  icon,
  title,
  desc,
  route,
}: {
  icon: string;
  title: string;
  desc: string;
  route: string;
}) {
  return (
    <>
      <TouchableOpacity
        style={styles.actionCard}
        activeOpacity={0.75}
        onPress={() => router.push(route as any)}
      >
        <View style={styles.actionCardLeft}>
          <Text style={styles.actionCardIcon}>{icon}</Text>
          <View>
            <Text style={styles.actionCardTitle}>{title}</Text>
            <Text style={styles.actionCardDesc}>{desc}</Text>
          </View>
        </View>
        <Text style={styles.actionCardArrow}>→</Text>
      </TouchableOpacity>
      <View style={styles.cardDivider} />
    </>
  );
}

/* ───────────── SCREEN ───────────── */

export default function ExploreScreen() {
  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <LinearGradient
          colors={["#6FA0C8", "#5A8FB5"]}
          style={styles.container}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerSmall}>Explore</Text>
            <Text style={styles.headerMain}>Featured & Tips</Text>
          </View>

          {/* CONTENT CARD */}
          <View style={styles.floatingCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* PRO TIPS */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 Pro Tips</Text>

                <View style={styles.tipsGrid}>
                  <TipCard
                    icon="⛽"
                    title="Track Fuel"
                    desc="Save fuel receipts"
                    onPress={() => router.push("/scan-receipt")}
                  />
                  <TipCard
                    icon="📊"
                    title="Analyze"
                    desc="Monthly reports"
                    onPress={() => router.push("/monthly-summary")}
                  />
                </View>

                <View style={styles.tipsGrid}>
                  <TipCard
                    icon="🔔"
                    title="Reminders"
                    desc="Never forget logs"
                  />
                  <TipCard
                    icon="📸"
                    title="Scan Fast"
                    desc="Camera capture"
                    onPress={() => router.push("/scan-receipt")}
                  />
                </View>
              </View>

              {/* STATS */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📈 Key Metrics</Text>

                <View style={styles.statsContainer}>
                  <Stat label="Features" value="8+" hint="Tools" />
                  <Divider />
                  <Stat label="Coverage" value="All" hint="Types" />
                  <Divider />
                  <Stat label="Reports" value="∞" hint="Monthly" />
                </View>
              </View>

              {/* ACTIONS */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>

                <View style={styles.actionCardsContainer}>
                  <ActionCard
                    icon="📋"
                    title="History"
                    desc="Receipts & BOLs"
                    route="/history"
                  />
                  <ActionCard
                    icon="📊"
                    title="Reports"
                    desc="Profit analysis"
                    route="/monthly-summary"
                  />
                  <ActionCard
                    icon="📈"
                    title="Analytics"
                    desc="Deep insights"
                    route="/analytics"
                  />
                </View>
              </View>

              {/* TIP BOX */}
              <View style={styles.section}>
                <View style={styles.tipsBox}>
                  <Text style={styles.tipsBoxIcon}>💬</Text>
                  <View style={styles.tipsBoxContent}>
                    <Text style={styles.tipsBoxTitle}>Pro Tip</Text>
                    <Text style={styles.tipsBoxDesc}>
                      Log expenses within 24 hours for accurate tracking &
                      tax benefits.
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </ScreenBackground>
  );
}

/* ───────────── SMALL COMPONENTS ───────────── */

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statHint}>{hint}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.statDivider} />;
}

/* ───────────── STYLES ───────────── */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  container: { flex: 1 },

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
  },

  headerSmall: {
    fontSize: FontSize.caption,
    color: "rgba(255,255,255,0.7)",
  },

  headerMain: {
    fontSize: FontSize.section,
    color: "#fff",
    fontWeight: FontWeight.extrabold,
  },

  floatingCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    marginTop: Spacing.xl,
  },

  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },

  section: {},

  sectionTitle: {
    ...TypographyScale.subtitle,
    marginBottom: Spacing.md,
  },

  tipsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },

  tipCard: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    ...getShadow(Shadow.card),
  },

  tipIcon: { fontSize: FontSize.section },

  tipTitle: {
    ...TypographyScale.small,
    fontWeight: FontWeight.bold,
  },

  tipDesc: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    textAlign: "center",
  },

  statsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },

  statItem: { flex: 1, alignItems: "center" },

  statLabel: { ...TypographyScale.caption },

  statValue: {
    ...TypographyScale.headline,
    color: Colors.secondary,
  },

  statHint: { ...TypographyScale.caption },

  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
  },

  actionCardsContainer: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.surfaceAlt,
  },

  actionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },

  actionCardLeft: {
    flexDirection: "row",
    gap: Spacing.md,
    flex: 1,
  },

  actionCardIcon: {
    fontSize: FontSize.largeIcon,
  },

  actionCardTitle: {
    ...TypographyScale.body,
  },

  actionCardDesc: {
    ...TypographyScale.caption,
    color: Colors.textMuted,
  },

  actionCardArrow: {
    fontSize: 18,
    color: Colors.secondary,
  },

  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },

  tipsBox: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
  },

  tipsBoxIcon: {
    fontSize: FontSize.largeIcon,
  },

  tipsBoxContent: { flex: 1 },

  tipsBoxTitle: {
    ...TypographyScale.body,
    color: Colors.secondary,
  },

  tipsBoxDesc: {
    ...TypographyScale.small,
  },
});