import HighContrastCard from "@/components/HighContrastCard";
import ScreenBackground from "@/components/ScreenBackground";
import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Spacing,
    Shadow,
    TypographyScale,
} from "@/constants/theme";
import { deleteTrip, getTripById, updateTrip } from "@/lib/tripService";
import type { Trip } from "@/lib/types";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function Field({
  label,
  value,
  onChangeText,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  editable?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <Text style={styles.inputPrefix}>$</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          editable={editable && onChangeText !== undefined}
        />
      </View>
    </View>
  );
}

export default function TripDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const tripId = params.id ? parseInt(params.id, 10) : null;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit form state
  const [income, setIncome] = useState("");
  const [fuel, setFuel] = useState("");
  const [tolls, setTolls] = useState("");
  const [food, setFood] = useState("");
  const [parking, setParking] = useState("");
  const [repairs, setRepairs] = useState("");
  const [otherExpenses, setOtherExpenses] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");

  const loadTrip = useCallback(async () => {
    if (!tripId) return;

    try {
      setIsLoading(true);
      const loaded = await getTripById(tripId);
      if (loaded) {
        setTrip(loaded);
        setIncome(loaded.income.toString());
        setFuel(loaded.fuel.toString());
        setTolls(loaded.tolls.toString());
        setFood(loaded.food.toString());
        setParking(loaded.parking.toString());
        setRepairs(loaded.repairs.toString());
        setOtherExpenses(loaded.other_expenses.toString());
        setDate(loaded.date);
        setNote(loaded.note ?? "");
      }
    } catch (error) {
      console.error("Failed to load trip:", error);
      Alert.alert("Error", "Could not load trip details");
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useFocusEffect(useCallback(() => {
    loadTrip();
  }, [loadTrip]));

  async function handleSaveChanges() {
    if (!tripId) return;

    const parsedIncome = Number(income.replace(/[^\d.]/g, ""));
    if (isNaN(parsedIncome) || parsedIncome <= 0) {
      Alert.alert("Invalid income", "Please enter a valid amount.");
      return;
    }

    setIsSaving(true);

    try {
      await updateTrip(tripId, {
        income: parsedIncome,
        fuel: Number(fuel.replace(/[^\d.]/g, "")) || 0,
        tolls: Number(tolls.replace(/[^\d.]/g, "")) || 0,
        food: Number(food.replace(/[^\d.]/g, "")) || 0,
        parking: Number(parking.replace(/[^\d.]/g, "")) || 0,
        repairs: Number(repairs.replace(/[^\d.]/g, "")) || 0,
        other_expenses: Number(otherExpenses.replace(/[^\d.]/g, "")) || 0,
        date,
        note,
      });

      Alert.alert("Success", "Trip updated successfully");
      setIsEditing(false);
      await loadTrip();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update trip";
      Alert.alert("Error", message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!tripId) return;

    Alert.alert("Delete Trip", "Are you sure you want to delete this trip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            await deleteTrip(tripId);
            Alert.alert("Deleted", "Trip has been deleted");
            router.back();
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to delete trip";
            Alert.alert("Error", message);
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.helperText}>Loading trip...</Text>
        </View>
      </SafeAreaView>
    </ScreenBackground>
    );
  }

  if (!trip) {
    return (
      <ScreenBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <Text style={styles.title}>Trip Not Found</Text>
          <Text style={styles.helperText}>The trip you're looking for doesn't exist.</Text>
          <Pressable onPress={() => router.back()} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Trip Details</Text>

            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={styles.editBtn}
            >
              <Text style={styles.editBtnText}>{isEditing ? "Cancel" : "Edit"}</Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <>
              <Field label="Load Income" value={income} onChangeText={setIncome} />
              <Field label="Fuel" value={fuel} onChangeText={setFuel} />
              <Field label="Tolls" value={tolls} onChangeText={setTolls} />
              <Field label="Food" value={food} onChangeText={setFood} />
              <Field label="Parking" value={parking} onChangeText={setParking} />
              <Field label="Repairs" value={repairs} onChangeText={setRepairs} />
              <Field label="Other Expenses" value={otherExpenses} onChangeText={setOtherExpenses} />

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Note</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  style={[styles.input, { height: 60 }]}
                  placeholder="Optional note"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
              </View>

              <Pressable
                onPress={handleSaveChanges}
                disabled={isSaving}
                style={({ pressed }) => [
                  styles.saveBtn,
                  pressed && { opacity: 0.85 },
                  isSaving && { opacity: 0.7 },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator color={Colors.textPrimary} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              {/* Hero Metrics Card */}
              <View style={styles.heroCard}>
                <Text style={styles.heroLabel}>Trip Profit</Text>
                <Text
                  style={[
                    styles.heroValue,
                    { color: trip.profit >= 0 ? Colors.primary : Colors.accent },
                  ]}
                >
                  {formatCurrency(trip.profit)}
                </Text>
                <View style={styles.heroMeta}>
                  <Text style={styles.heroMetaText}>
                    {trip.date}
                  </Text>
                  <View style={styles.heroMetaDivider} />
                  <Text style={styles.heroMetaText}>
                    Income: {formatCurrency(trip.income)}
                  </Text>
                </View>
              </View>

              {/* Details Card */}
              <HighContrastCard style={styles.resultCard}>
                <Text style={styles.sectionTitle}>Expenses Breakdown</Text>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Date</Text>
                  <Text style={styles.resultValue}>{trip.date}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Income</Text>
                  <Text style={styles.resultValue}>{formatCurrency(trip.income)}</Text>
                </View>

                <View style={[styles.resultRow, { marginTop: Spacing.md }]}>
                  <Text style={styles.resultLabel}>Fuel</Text>
                  <Text style={styles.resultValue}>{formatCurrency(trip.fuel)}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Tolls</Text>
                  <Text style={styles.resultValue}>{formatCurrency(trip.tolls)}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Food</Text>
                  <Text style={styles.resultValue}>{formatCurrency(trip.food)}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Parking</Text>
                  <Text style={styles.resultValue}>{formatCurrency(trip.parking)}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Repairs</Text>
                  <Text style={styles.resultValue}>{formatCurrency(trip.repairs)}</Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Other</Text>
                  <Text style={styles.resultValue}>{formatCurrency(trip.other_expenses)}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Total Expenses</Text>
                  <Text style={styles.resultValue}>{formatCurrency(trip.total_expenses)}</Text>
                </View>

                {trip.note && (
                  <>
                    <View style={styles.divider} />
                    <View>
                      <Text style={styles.noteLabel}>Note</Text>
                      <Text style={styles.noteValue}>{trip.note}</Text>
                    </View>
                  </>
                )}
              </HighContrastCard>

              <Pressable
                onPress={handleDelete}
                disabled={isDeleting}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  pressed && { opacity: 0.85 },
                  isDeleting && { opacity: 0.7 },
                ]}
              >
                {isDeleting ? (
                  <ActivityIndicator color={Colors.danger} />
                ) : (
                  <Text style={styles.deleteBtnText}>Delete Trip</Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
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
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.xl,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  backText: {
    fontSize: 28,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  title: {
    ...TypographyScale.headline,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  editBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  editBtnText: {
    color: Colors.primary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
  },
  helperText: {
    color: Colors.textSecondary,
    textAlign: "center",
    fontSize: FontSize.body,
  },

  /* Hero Metrics Card */
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadow.card,
    marginBottom: Spacing.xl,
    alignItems: "center",
  },
  heroLabel: {
    ...TypographyScale.small,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  heroValue: {
    ...TypographyScale.display,
    color: Colors.primary,
    fontWeight: '800' as const,
    marginBottom: Spacing.md,
  },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  heroMetaText: {
    ...TypographyScale.small,
    color: Colors.textSecondary,
  },
  heroMetaDivider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.borderLight,
  },

  /* Form Fields */
  fieldWrap: {
    gap: Spacing.xs,
  },
  fieldLabel: {
    ...TypographyScale.small,
    color: Colors.textSecondary,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
  },
  inputPrefix: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    paddingVertical: Spacing.md,
    fontWeight: FontWeight.semibold,
  },

  /* Result Card */
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadow.card,
    gap: Spacing.lg,
  },
  sectionTitle: {
    ...TypographyScale.subtitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  resultLabel: {
    ...TypographyScale.small,
    color: Colors.textSecondary,
  },
  resultValue: {
    ...TypographyScale.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  profitLabel: {
    fontSize: FontSize.section,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  profitValue: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.extrabold,
  },
  noteLabel: {
    ...TypographyScale.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  noteValue: {
    ...TypographyScale.body,
    color: Colors.textPrimary,
  },

  /* Action Buttons */
  saveBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    minHeight: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.button,
  },
  saveBtnText: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
  deleteBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.accent + '14',
    borderWidth: 1.5,
    borderColor: Colors.accent + '40',
    minHeight: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    color: Colors.accent,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
  primaryBtn: {
    minHeight: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.button,
  },
  primaryBtnText: {
    color: Colors.textPrimary,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
});
