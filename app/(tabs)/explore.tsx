import ScreenBackground from "@/components/ScreenBackground";
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

export default function ExploreScreen() {
  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
        <LinearGradient
          colors={["#6FA0C8", "#5A8FB5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.container}
        >
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* HEADER - Premium title section */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.header}>
            <Text style={styles.headerSmall}>Explore</Text>
            <Text style={styles.headerMain}>Featured & Tips</Text>
          </View>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* FLOATING CARD - White card with all content */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <View style={styles.floatingCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* FEATURED TIPS SECTION */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 Pro Tips</Text>

                <View style={styles.tipsGrid}>
                  {/* Tip Card 1 */}
                  <TouchableOpacity
                    style={styles.tipCard}
                    activeOpacity={0.85}
                    onPress={() => {}}
                  >
                    <View style={styles.tipIcon}>⛽</View>
                    <Text style={styles.tipTitle}>Track Fuel Costs</Text>
                    <Text style={styles.tipDesc}>
                      Save fuel receipts for better margins
                    </Text>
                  </TouchableOpacity>

                  {/* Tip Card 2 */}
                  <TouchableOpacity
                    style={styles.tipCard}
                    activeOpacity={0.85}
                    onPress={() => {}}
                  >
                    <View style={styles.tipIcon}>📊</View>
                    <Text style={styles.tipTitle}>Analyze Trends</Text>
                    <Text style={styles.tipDesc}>
                      View monthly reports for insights
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.tipsGrid}>
                  {/* Tip Card 3 */}
                  <TouchableOpacity
                    style={styles.tipCard}
                    activeOpacity={0.85}
                    onPress={() => {}}
                  >
                    <View style={styles.tipIcon}>🔔</View>
                    <Text style={styles.tipTitle}>Set Reminders</Text>
                    <Text style={styles.tipDesc}>
                      Never forget to log your expenses
                    </Text>
                  </TouchableOpacity>

                  {/* Tip Card 4 */}
                  <TouchableOpacity
                    style={styles.tipCard}
                    activeOpacity={0.85}
                    onPress={() => {}}
                  >
                    <View style={styles.tipIcon}>📱</View>
                    <Text style={styles.tipTitle}>Quick Logging</Text>
                    <Text style={styles.tipDesc}>
                      Use camera scan for faster entry
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* QUICK STATS SECTION */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📈 Key Metrics</Text>

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Features</Text>
                    <Text style={styles.statValue}>8+</Text>
                    <Text style={styles.statHint}>Tracking tools</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Coverage</Text>
                    <Text style={styles.statValue}>All</Text>
                    <Text style={styles.statHint}>Expense types</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Reports</Text>
                    <Text style={styles.statValue}>∞</Text>
                    <Text style={styles.statHint}>Monthly views</Text>
                  </View>
                </View>
              </View>

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* FEATURED ACTIONS SECTION */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>

                {/* Action Card 1 */}
                <TouchableOpacity
                  style={styles.actionCard}
                  activeOpacity={0.75}
                  onPress={() => router.push("/history")}
                >
                  <View style={styles.actionCardLeft}>
                    <Text style={styles.actionCardIcon}>📋</Text>
                    <View>
                      <Text style={styles.actionCardTitle}>View History</Text>
                      <Text style={styles.actionCardDesc}>
                        Browse all receipts & BOLs
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.actionCardArrow}>→</Text>
                </TouchableOpacity>

                <View style={styles.cardDivider} />

                {/* Action Card 2 */}
                <TouchableOpacity
                  style={styles.actionCard}
                  activeOpacity={0.75}
                  onPress={() => router.push("/monthly-summary")}
                >
                  <View style={styles.actionCardLeft}>
                    <Text style={styles.actionCardIcon}>📊</Text>
                    <View>
                      <Text style={styles.actionCardTitle}>Monthly Reports</Text>
                      <Text style={styles.actionCardDesc}>
                        Detailed profit analysis
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.actionCardArrow}>→</Text>
                </TouchableOpacity>

                <View style={styles.cardDivider} />

                {/* Action Card 3 */}
                <TouchableOpacity
                  style={styles.actionCard}
                  activeOpacity={0.75}
                  onPress={() => router.push("/analytics")}
                >
                  <View style={styles.actionCardLeft}>
                    <Text style={styles.actionCardIcon}>📈</Text>
                    <View>
                      <Text style={styles.actionCardTitle}>Analytics</Text>
                      <Text style={styles.actionCardDesc}>
                        Deep dive into metrics
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.actionCardArrow}>→</Text>
                </TouchableOpacity>
              </View>

              {/* ═══════════════════════════════════════════════════════════════ */}
              {/* TIPS BOX SECTION */}
              {/* ═══════════════════════════════════════════════════════════════ */}
              <View style={styles.section}>
                <View style={styles.tipsBox}>
                  <Text style={styles.tipsBoxIcon}>💬</Text>
                  <View style={styles.tipsBoxContent}>
                    <Text style={styles.tipsBoxTitle}>Pro Tip</Text>
                    <Text style={styles.tipsBoxDesc}>
                      Logging expenses within 24 hours ensures accuracy and helps
                      with tax deductions
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  // ─── HEADER ────────────────────────────────────────────────────────

  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },

  headerSmall: {
    fontSize: FontSize.caption,
    color: "rgba(255,255,255,0.7)",
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },

  headerMain: {
    fontSize: FontSize.section,
    color: "#fff",
    fontWeight: FontWeight.extrabold,
  },

  // ─── FLOATING CARD ────────────────────────────────────────────────

  floatingCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    marginTop: Spacing.xl,
    overflow: "hidden",
    ...Shadow.large,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
  },

  // ─── SECTIONS ──────────────────────────────────────────────────

  section: {
    marginBottom: Spacing.xl,
  },

  sectionTitle: {
    ...TypographyScale.subtitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // ─── TIPS GRID ─────────────────────────────────────────────────

  tipsGrid: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  tipCard: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
    ...Shadow.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },

  tipIcon: {
    fontSize: FontSize.section,
  },

  tipTitle: {
    ...TypographyScale.small,
    color: Colors.textPrimary,
    textAlign: "center",
  },

  tipDesc: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 15,
  },

  // ─── STATS CONTAINER ────────────────────────────────────────────

  statsContainer: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    ...Shadow.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.sm,
  },

  statLabel: {
    ...TypographyScale.caption,
    color: Colors.textMuted,
  },

  statValue: {
    ...TypographyScale.headline,
    color: Colors.secondary,
  },

  statHint: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },

  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.borderLight,
  },

  // ─── ACTION CARDS ──────────────────────────────────────────────

  actionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },

  actionCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    flex: 1,
  },

  actionCardIcon: {
    fontSize: FontSize.largeIcon,
  },

  actionCardTitle: {
    ...TypographyScale.body,
    color: Colors.textPrimary,
  },

  actionCardDesc: {
    ...TypographyScale.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  actionCardArrow: {
    fontSize: FontSize.body,
    color: Colors.secondary,
    fontWeight: FontWeight.bold,
  },

  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.lg,
  },

  // ─── ACTION CARDS CONTAINER ────────────────────────────────────

  actionCardsContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadow.card,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },

  // ─── TIPS BOX ──────────────────────────────────────────────────

  tipsBox: {
    backgroundColor: "rgba(111, 160, 200, 0.1)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: "row",
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.secondary + "33",
  },

  tipsBoxIcon: {
    fontSize: FontSize.largeIcon,
  },

  tipsBoxContent: {
    flex: 1,
    gap: Spacing.sm,
  },

  tipsBoxTitle: {
    ...TypographyScale.body,
    color: Colors.secondary,
  },

  tipsBoxDesc: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    lineHeight: 20,
  },
});