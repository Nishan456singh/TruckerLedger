import CategorySelector from '@/components/CategorySelector';
import PrimaryButton from '@/components/PrimaryButton';
import ReceiptPreview from '@/components/ReceiptPreview';
import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
    type Category,
} from '@/constants/theme';
import { addExpense } from '@/lib/expenseService';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenMode = 'pick' | 'manual';

function formatDateDisplay(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function AddExpenseScreen() {
  const params = useLocalSearchParams<{ mode?: string; category?: string }>();

  const [mode, setMode] = useState<ScreenMode>(
    params.mode === 'manual' ? 'manual' : 'pick'
  );
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(
    (params.category as Category) ?? 'fuel'
  );
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const amountRef = useRef<TextInput>(null);

  useEffect(() => {
    if (mode === 'manual') {
      setTimeout(() => amountRef.current?.focus(), 300);
    }
  }, [mode]);

  // ── Pick receipt from library ───────────────────────────────────────────────
  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to attach receipts.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setReceiptUri(result.assets[0].uri);
    }
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid amount', 'Please enter a valid expense amount.');
      return;
    }

    setSaving(true);
    try {
      await addExpense({
        amount: parsedAmount,
        category,
        note: note.trim(),
        date,
        receipt_uri: receiptUri,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to save expense. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  }

  // ── Render pick mode ────────────────────────────────────────────────────────
  if (mode === 'pick') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View entering={FadeIn.duration(220)} style={styles.pickContainer}>
          {/* Header */}
          <View style={styles.pickHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.pickTitle}>Add Expense</Text>
            <View style={{ width: 36 }} />
          </View>

          <Text style={styles.pickSubtitle}>How would you like to add this expense?</Text>

          {/* Scan Receipt */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <TouchableOpacity
              style={styles.pickCard}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/scan-receipt');
              }}
            >
              <View style={[styles.pickIconCircle, { backgroundColor: Colors.accent + '20' }]}>
                <Text style={styles.pickIcon}>📷</Text>
              </View>
              <View style={styles.pickCardText}>
                <Text style={styles.pickCardTitle}>Scan Receipt</Text>
                <Text style={styles.pickCardDesc}>
                  Take a photo of your receipt — we'll log it instantly
                </Text>
              </View>
              <Text style={styles.pickArrow}>›</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Add Manually */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <TouchableOpacity
              style={styles.pickCard}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setMode('manual');
              }}
            >
              <View style={[styles.pickIconCircle, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={styles.pickIcon}>✏️</Text>
              </View>
              <View style={styles.pickCardText}>
                <Text style={styles.pickCardTitle}>Add Manually</Text>
                <Text style={styles.pickCardDesc}>
                  Enter amount, category, and notes by hand
                </Text>
              </View>
              <Text style={styles.pickArrow}>›</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Manual form mode ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            entering={FadeInDown.delay(0).springify()}
            style={styles.formHeader}
          >
            <TouchableOpacity onPress={() => setMode('pick')} style={styles.backBtn}>
              <Text style={styles.backBtnText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.formTitle}>New Expense</Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Amount input */}
          <Animated.View
            entering={FadeInDown.delay(80).springify()}
            style={styles.amountContainer}
          >
            <Text style={styles.currencySign}>$</Text>
            <TextInput
              ref={amountRef}
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={Colors.textMuted}
              keyboardType="decimal-pad"
              returnKeyType="done"
              maxLength={10}
            />
          </Animated.View>

          {/* Category */}
          <Animated.View
            entering={FadeInDown.delay(160).springify()}
            style={styles.fieldGroup}
          >
            <CategorySelector selected={category} onChange={setCategory} />
          </Animated.View>

          {/* Date */}
          <Animated.View
            entering={FadeInDown.delay(220).springify()}
            style={styles.fieldGroup}
          >
            <Text style={styles.fieldLabel}>Date</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.datePill, date === todayISO() && styles.datePillActive]}
                onPress={() => setDate(todayISO())}
              >
                <Text style={[styles.datePillText, date === todayISO() && styles.datePillTextActive]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datePill, date === yesterdayISO() && styles.datePillActive]}
                onPress={() => setDate(yesterdayISO())}
              >
                <Text
                  style={[
                    styles.datePillText,
                    date === yesterdayISO() && styles.datePillTextActive,
                  ]}
                >
                  Yesterday
                </Text>
              </TouchableOpacity>
              <View style={styles.dateDisplayPill}>
                <Text style={styles.dateDisplayText}>{formatDateDisplay(date)}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Notes */}
          <Animated.View
            entering={FadeInDown.delay(280).springify()}
            style={styles.fieldGroup}
          >
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Diesel fill-up on I-80"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
            />
          </Animated.View>

          {/* Receipt */}
          <Animated.View
            entering={FadeInDown.delay(340).springify()}
            style={styles.fieldGroup}
          >
            {receiptUri ? (
              <ReceiptPreview
                uri={receiptUri}
                onRemove={() => setReceiptUri(null)}
              />
            ) : (
              <TouchableOpacity
                style={styles.attachReceiptBtn}
                onPress={handlePickImage}
                activeOpacity={0.75}
              >
                <Text style={styles.attachIcon}>📎</Text>
                <Text style={styles.attachLabel}>Attach Receipt Photo</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Save Button */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.footer}>
          <PrimaryButton
            label="Save Expense"
            onPress={handleSave}
            variant="primary"
            size="lg"
            loading={saving}
            disabled={!amount || saving}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },

  // ── Pick mode ──────────────────────────────────────────────────────────────
  pickContainer: {
    flex: 1,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  pickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  pickTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  pickSubtitle: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  pickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  pickIconCircle: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pickIcon: {
    fontSize: 26,
  },
  pickCardText: {
    flex: 1,
    gap: 4,
  },
  pickCardTitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  pickCardDesc: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  pickArrow: {
    fontSize: 24,
    color: Colors.textMuted,
    flexShrink: 0,
  },

  // ── Manual form ────────────────────────────────────────────────────────────
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  formTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  backBtnText: {
    fontSize: FontSize.body,
    color: Colors.primary,
    fontWeight: FontWeight.medium,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: FontWeight.semibold,
  },

  // Amount
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary + '50',
    gap: Spacing.sm,
    ...Shadow.card,
  },
  currencySign: {
    fontSize: FontSize.title + 4,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  amountInput: {
    flex: 1,
    fontSize: FontSize.title + 4,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    padding: 0,
  },

  // Fields
  fieldGroup: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Date
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  datePill: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  datePillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '20',
  },
  datePillText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  datePillTextActive: {
    color: Colors.primary,
  },
  dateDisplayPill: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.cardAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateDisplayText: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },

  // Notes
  notesInput: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
  },

  // Attach receipt
  attachReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  attachIcon: {
    fontSize: 18,
  },
  attachLabel: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },

  // Footer
  footer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
});
