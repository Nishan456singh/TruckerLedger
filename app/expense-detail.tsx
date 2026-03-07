import CategorySelector from '@/components/CategorySelector';
import PrimaryButton from '@/components/PrimaryButton';
import ReceiptPreview from '@/components/ReceiptPreview';
import {
    BorderRadius,
    CategoryMeta,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
    type Category,
} from '@/constants/theme';
import {
    deleteExpense,
    getExpenseById,
    updateExpense,
} from '@/lib/expenseService';
import type { Expense } from '@/lib/types';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(v);
}

function formatDateDisplay(iso: string): string {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (iso === today) return 'Today';
  if (iso === yesterday) return 'Yesterday';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export default function ExpenseDetailScreen() {
  const params = useLocalSearchParams<{ id: string; fromScan?: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [editing, setEditing] = useState(params.fromScan === '1');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editable fields
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  // Receipt full-screen preview
  const [showReceiptFull, setShowReceiptFull] = useState(false);

  const amountRef = useRef<TextInput>(null);

  useEffect(() => {
    if (params.id) {
      loadExpense(Number(params.id));
    }
  }, [params.id]);

  useEffect(() => {
    if (editing) {
      setTimeout(() => amountRef.current?.focus(), 200);
    }
  }, [editing]);

  async function loadExpense(id: number) {
    const data = await getExpenseById(id);
    if (!data) {
      Alert.alert('Not found', 'Expense could not be found.');
      router.back();
      return;
    }
    setExpense(data);
    setAmount(String(data.amount === 0 ? '' : data.amount));
    setCategory(data.category as Category);
    setDate(data.date);
    setNote(data.note ?? '');
    setReceiptUri(data.receipt_uri ?? null);
  }

  async function handleSave() {
    if (!expense) return;
    const parsedAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Invalid amount', 'Please enter a valid expense amount.');
      return;
    }

    setSaving(true);
    try {
      await updateExpense(expense.id, {
        amount: parsedAmount,
        category,
        note: note.trim(),
        date,
        receipt_uri: receiptUri,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadExpense(expense.id);
      setEditing(false);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update expense.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!expense) return;
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteExpense(expense.id);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              router.back();
            } catch {
              setDeleting(false);
              Alert.alert('Error', 'Failed to delete expense.');
            }
          },
        },
      ]
    );
  }

  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required.');
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

  if (!expense) {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'bottom']}>
        <Text style={styles.loadingText}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const meta = CategoryMeta[expense.category as Category] ?? CategoryMeta.other;

  // ── View mode ──────────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.viewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.springify()} style={styles.viewHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.viewTitle}>Expense Detail</Text>
            <TouchableOpacity
              onPress={() => setEditing(true)}
              style={styles.editBtn}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Hero amount card */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.heroCard}>
            <View style={[styles.heroIcon, { backgroundColor: meta.color + '25' }]}>
              <Text style={styles.heroEmoji}>{meta.icon}</Text>
            </View>
            <Text style={styles.heroAmount}>{formatCurrency(expense.amount)}</Text>
            <Text style={[styles.heroCategory, { color: meta.color }]}>
              {meta.label}
            </Text>
          </Animated.View>

          {/* Detail rows */}
          <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.detailCard}>
            <DetailRow icon="📅" label="Date" value={formatDateDisplay(expense.date)} />
            {expense.note ? (
              <DetailRow icon="📝" label="Notes" value={expense.note} />
            ) : null}
          </Animated.View>

          {/* Receipt */}
          {receiptUri && (
            <Animated.View
              entering={FadeInDown.delay(240).springify()}
              style={styles.section}
            >
              <ReceiptPreview
                uri={receiptUri}
                onPress={() => setShowReceiptFull(true)}
              />
            </Animated.View>
          )}

          {/* Delete */}
          <Animated.View entering={FadeInDown.delay(320).springify()} style={styles.deleteSection}>
            <PrimaryButton
              label="Delete Expense"
              onPress={handleDelete}
              variant="danger"
              size="md"
              loading={deleting}
            />
          </Animated.View>
        </ScrollView>

        {/* Full receipt modal */}
        {receiptUri && (
          <Modal
            visible={showReceiptFull}
            transparent
            animationType="fade"
            onRequestClose={() => setShowReceiptFull(false)}
          >
            <View style={styles.modalBg}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowReceiptFull(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              <ReceiptPreview uri={receiptUri} />
            </View>
          </Modal>
        )}
      </SafeAreaView>
    );
  }

  // ── Edit mode ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.editContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(200)} style={styles.editHeader}>
            <TouchableOpacity
              onPress={() => {
                if (params.fromScan === '1') {
                  router.back();
                } else {
                  setEditing(false);
                }
              }}
              style={styles.backBtn}
            >
              <Text
                style={
                  params.fromScan === '1' ? styles.cancelText : styles.backText
                }
              >
                {params.fromScan === '1' ? 'Cancel' : '‹'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.viewTitle}>Edit Expense</Text>
            <View style={{ width: 48 }} />
          </Animated.View>

          {/* Amount */}
          <Animated.View
            entering={FadeInDown.delay(60).springify()}
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
              maxLength={10}
            />
          </Animated.View>

          {/* Category */}
          <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.fieldGroup}>
            <CategorySelector selected={category} onChange={setCategory} />
          </Animated.View>

          {/* Date */}
          <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date</Text>
            <View style={styles.dateRow}>
              {[
                { label: 'Today', value: todayISO() },
                { label: 'Yesterday', value: yesterdayISO() },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.datePill, date === opt.value && styles.datePillActive]}
                  onPress={() => setDate(opt.value)}
                >
                  <Text
                    style={[
                      styles.datePillText,
                      date === opt.value && styles.datePillTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Notes */}
          <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
            />
          </Animated.View>

          {/* Receipt */}
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.fieldGroup}>
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

        {/* Footer */}
        <View style={styles.footer}>
          <PrimaryButton
            label="Save Changes"
            onPress={handleSave}
            variant="primary"
            size="lg"
            loading={saving}
            disabled={!amount || saving}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.icon}>{icon}</Text>
      <View style={detailStyles.textGroup}>
        <Text style={detailStyles.label}>{label}</Text>
        <Text style={detailStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  icon: {
    fontSize: 18,
    marginTop: 2,
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.body,
  },

  // View mode
  viewContent: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  viewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 28,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
    lineHeight: 32,
  },
  cancelText: {
    fontSize: FontSize.body,
    color: Colors.danger,
    fontWeight: FontWeight.medium,
  },
  viewTitle: {
    flex: 1,
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  editBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  editBtnText: {
    fontSize: FontSize.body,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },

  // Hero card
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 36,
  },
  heroAmount: {
    fontSize: FontSize.title + 6,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
  },
  heroCategory: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.5,
  },

  detailCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  section: {
    gap: Spacing.sm,
  },
  deleteSection: {
    marginTop: Spacing.xl,
  },

  // Modal
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    padding: Spacing.xl,
    paddingTop: 60,
  },
  modalClose: {
    position: 'absolute',
    top: 56,
    right: Spacing.xl,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: FontWeight.semibold,
  },

  // Edit mode
  editContent: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
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
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
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
  footer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
});
