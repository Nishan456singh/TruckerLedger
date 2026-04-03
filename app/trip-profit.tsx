import PremiumButton from "@/components/PremiumButton";
import ScreenBackground from "@/components/ScreenBackground";
import { getShadow } from "@/constants/shadowUtils";
import {
    BorderRadius,
    Colors,
    ColorUtilities,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
    TypographyScale
} from "@/constants/theme";
import { calculateTripProfit, createTrip } from "@/lib/tripService";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Animated, {
    FadeInDown,
    FadeInUp,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

function parseAmount(value: string): number {
  if (!value.trim()) return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function TripProfitScreen() {
  const [income, setIncome] = useState("");
  const [fuel, setFuel] = useState("");
  const [tolls, setTolls] = useState("");
  const [food, setFood] = useState("");
  const [parking, setParking] = useState("");
  const [repairs, setRepairs] = useState("");
  const [otherExpenses, setOtherExpenses] = useState("");
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(
    () => ({
      income: parseAmount(income),
      fuel: parseAmount(fuel),
      tolls: parseAmount(tolls),
      food: parseAmount(food),
      parking: parseAmount(parking),
      repairs: parseAmount(repairs),
      other_expenses: parseAmount(otherExpenses),
    }),
    [income, fuel, tolls, food, parking, repairs, otherExpenses]
  );

  const { totalExpenses, profit } = useMemo(
    () => calculateTripProfit(parsed),
    [parsed]
  );

  async function handleSaveTrip() {
    if (parsed.income <= 0) {
      Alert.alert("Income required", "Enter load income before saving the trip.");
      return;
    }

    setSaving(true);

    try {
      await createTrip({
        ...parsed,
        date: new Date().toISOString().split("T")[0],
      });

      Alert.alert("Trip saved", "Trip profit has been saved locally.");
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save trip.";
      Alert.alert("Save failed", message);
    } finally {
      setSaving(false);
    }
  }

  const profitColor = profit >= 0 ? Colors.primary : Colors.danger;
  const profitEmoji = profit >= 0 ? "📈" : "📉";

  const heroHint = useMemo(
    () => profit >= 0 ? "✓ Profitable trip" : "⚠ Adjust expenses",
    [profit]
  );

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.container}>
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* HERO SECTION (50% - Yellow/Action themed)                      */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            <LinearGradient
              colors={[Colors.primary, '#E8B107']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroSection}
            >
              {/* Top Bar */}
              <View style={styles.heroTopBar}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.heroBackBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.heroBackText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.heroTitle}>Trip Profit Calculator</Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Centered Profit Display */}
              <View style={styles.heroProfitCenter}>
                <Text style={styles.heroProfitLabel}>Net Profit</Text>
                <View style={styles.heroProfitDisplay}>
                  <Text style={[styles.heroProfitValue, { color: profitColor }]}>
                    {formatCurrency(profit)}
                  </Text>
                </View>
                <Text style={styles.heroProfitEmoji}>{profitEmoji}</Text>
                <Text style={styles.heroHint}>{heroHint}</Text>
              </View>

              {/* Metric Pills */}
              <View style={styles.heroMetricPills}>
                <View style={styles.metricPill}>
                  <Text style={styles.metricPillLabel}>Income</Text>
                  <Text style={styles.metricPillValue}>
                    {formatCurrency(parsed.income)}
                  </Text>
                </View>
                <View style={styles.metricPill}>
                  <Text style={styles.metricPillLabel}>Expenses</Text>
                  <Text style={styles.metricPillValue}>
                    {formatCurrency(totalExpenses)}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* FLOATING CARD (50%+ - Form & Actions)                         */}
            {/* ═══════════════════════════════════════════════════════════════ */}

            <View style={styles.floatingCardContainer}>
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.cardContent}
                >
                  {/* Trip Income */}
                  <Animated.View entering={FadeInDown}>
                    <Text style={styles.cardSectionTitle}>💰 Trip Income</Text>
                    <View style={styles.inputWrap}>
                      <Text style={styles.inputPrefix}>$</Text>
                      <TextInput
                        value={income}
                        onChangeText={setIncome}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={Colors.textMuted}
                        style={styles.input}
                      />
                    </View>
                  </Animated.View>

                  {/* Trip Expenses */}
                  <Animated.View entering={FadeInDown.delay(50)}>
                    <Text style={styles.cardSectionTitle}>💸 Trip Expenses</Text>
                    <Text style={styles.expenseGridDescription}>Track all your trip costs</Text>
                    <View style={styles.expenseGrid}>
                      <View style={styles.expenseField}>
                        <View style={styles.expenseLabelRow}>
                          <Text style={styles.expenseIcon}>⛽</Text>
                          <Text style={styles.expenseLabel}>Fuel</Text>
                        </View>
                        <View style={styles.inputWrap}>
                          <Text style={styles.inputPrefix}>$</Text>
                          <TextInput
                            value={fuel}
                            onChangeText={setFuel}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={Colors.textMuted}
                            style={styles.input}
                          />
                        </View>
                      </View>

                      <View style={styles.expenseField}>
                        <View style={styles.expenseLabelRow}>
                          <Text style={styles.expenseIcon}>🛣️</Text>
                          <Text style={styles.expenseLabel}>Tolls</Text>
                        </View>
                        <View style={styles.inputWrap}>
                          <Text style={styles.inputPrefix}>$</Text>
                          <TextInput
                            value={tolls}
                            onChangeText={setTolls}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={Colors.textMuted}
                            style={styles.input}
                          />
                        </View>
                      </View>

                      <View style={styles.expenseField}>
                        <View style={styles.expenseLabelRow}>
                          <Text style={styles.expenseIcon}>🍔</Text>
                          <Text style={styles.expenseLabel}>Food</Text>
                        </View>
                        <View style={styles.inputWrap}>
                          <Text style={styles.inputPrefix}>$</Text>
                          <TextInput
                            value={food}
                            onChangeText={setFood}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={Colors.textMuted}
                            style={styles.input}
                          />
                        </View>
                      </View>

                      <View style={styles.expenseField}>
                        <View style={styles.expenseLabelRow}>
                          <Text style={styles.expenseIcon}>🅿️</Text>
                          <Text style={styles.expenseLabel}>Parking</Text>
                        </View>
                        <View style={styles.inputWrap}>
                          <Text style={styles.inputPrefix}>$</Text>
                          <TextInput
                            value={parking}
                            onChangeText={setParking}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={Colors.textMuted}
                            style={styles.input}
                          />
                        </View>
                      </View>

                      <View style={styles.expenseField}>
                        <View style={styles.expenseLabelRow}>
                          <Text style={styles.expenseIcon}>🔧</Text>
                          <Text style={styles.expenseLabel}>Repairs</Text>
                        </View>
                        <View style={styles.inputWrap}>
                          <Text style={styles.inputPrefix}>$</Text>
                          <TextInput
                            value={repairs}
                            onChangeText={setRepairs}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={Colors.textMuted}
                            style={styles.input}
                          />
                        </View>
                      </View>

                      <View style={styles.expenseField}>
                        <View style={styles.expenseLabelRow}>
                          <Text style={styles.expenseIcon}>📦</Text>
                          <Text style={styles.expenseLabel}>Other</Text>
                        </View>
                        <View style={styles.inputWrap}>
                          <Text style={styles.inputPrefix}>$</Text>
                          <TextInput
                            value={otherExpenses}
                            onChangeText={setOtherExpenses}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            placeholderTextColor={Colors.textMuted}
                            style={styles.input}
                          />
                        </View>
                      </View>
                    </View>
                  </Animated.View>

                  {/* Summary */}
                  {parsed.income > 0 && (
                    <Animated.View entering={FadeInDown.delay(100)} style={styles.summarySection}>
                      <Text style={styles.summaryTitle}>Trip Summary</Text>

                      <View style={styles.summaryRow}>
                        <View style={styles.summaryLabel}>
                          <Text style={styles.summaryIcon}>💰</Text>
                          <View>
                            <Text style={styles.summaryRowLabel}>Total Income</Text>
                            <Text style={styles.summaryRowHint}>All loads</Text>
                          </View>
                        </View>
                        <Text style={styles.summaryRowValue}>{formatCurrency(parsed.income)}</Text>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.summaryRow}>
                        <View style={styles.summaryLabel}>
                          <Text style={styles.summaryIcon}>💸</Text>
                          <View>
                            <Text style={styles.summaryRowLabel}>Total Expenses</Text>
                            <Text style={styles.summaryRowHint}>All costs</Text>
                          </View>
                        </View>
                        <Text style={styles.summaryRowValue}>{formatCurrency(totalExpenses)}</Text>
                      </View>

                      <View style={styles.divider} />

                      <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
                        <View style={styles.summaryLabel}>
                          <Text style={styles.summaryIcon}>📊</Text>
                          <View>
                            <Text style={styles.summaryRowLabel}>Net Profit</Text>
                            <Text style={styles.summaryRowHint}>Bottom line</Text>
                          </View>
                        </View>
                        <Text style={styles.summaryRowValueHighlight}>{formatCurrency(profit)}</Text>
                      </View>
                    </Animated.View>
                  )}
                </ScrollView>
              </KeyboardAvoidingView>

              {/* Bottom Action Buttons */}
              <Animated.View entering={FadeInUp} style={styles.cardFooter}>
                <PremiumButton
                  label="💾 Save Trip"
                  onPress={handleSaveTrip}
                  loading={saving}
                  disabled={!income || saving}
                  size="large"
                  fullWidth
                />
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    flex: 0.5,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
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
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  heroTitle: {
    ...TypographyScale.subtitle,
    color: Colors.textPrimary,
  },

  heroProfitCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },

  heroProfitLabel: {
    ...TypographyScale.caption,
    color: Colors.textInverse,
  },

  heroHint: {
    fontSize: FontSize.caption,
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
    marginTop: Spacing.sm,
  },

  heroProfitDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  heroProfitValue: {
    ...TypographyScale.display,
  },

  heroProfitEmoji: {
    fontSize: FontSize.largeIcon,
    marginTop: Spacing.sm,
  },

  heroMetricPills: {
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "center",
  },

  metricPill: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    minWidth: 100,
  },

  metricPillLabel: {
    fontSize: FontSize.caption,
    color: Colors.textInverse,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.xs,
  },

  metricPillValue: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  // ─── FLOATING CARD ──────────────────────────────────────────

  floatingCardContainer: {
    flex: 1,
    marginTop: -Spacing.xl,
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    ...getShadow(Shadow.large),
  },

  cardContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },

  cardSectionTitle: {
    ...TypographyScale.subtitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  expenseGridDescription: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    marginBottom: Spacing.md,
  },

  // ─── INCOME INPUT ────────────────────────────────────────────

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    ...getShadow(Shadow.small),
  },

  inputPrefix: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
    marginRight: Spacing.xs,
    fontWeight: FontWeight.semibold,
  },

  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    paddingVertical: Spacing.md,
    fontWeight: FontWeight.semibold,
  },

  // ─── EXPENSE GRID ────────────────────────────────────────────

  expenseGrid: {
    gap: Spacing.md,
  },

  expenseField: {
    gap: Spacing.sm,
  },

  expenseLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },

  expenseIcon: {
    fontSize: FontSize.body,
  },

  expenseLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
  },

  // ─── SUMMARY ─────────────────────────────────────────────────

  summarySection: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...getShadow(Shadow.small),
  },

  summaryTitle: {
    ...TypographyScale.subtitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },

  summaryLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },

  summaryIcon: {
    fontSize: FontSize.statIcon,
  },

  summaryRowLabel: {
    ...TypographyScale.body,
    color: Colors.textPrimary,
  },

  summaryRowHint: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
    marginTop: Spacing.xs,
  },

  summaryRowValue: {
    ...TypographyScale.body,
    color: Colors.textPrimary,
  },

  summaryRowValueHighlight: {
    ...TypographyScale.body,
    color: Colors.primary,
  },

  summaryRowHighlight: {
    backgroundColor: Colors.primary + '0D',
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: Colors.borderLight,
    borderBottomColor: Colors.borderLight,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 0,
  },

  // ─── FOOTER ──────────────────────────────────────────────────

  cardFooter: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  cancelBtn: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelBtnText: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
  },
});
