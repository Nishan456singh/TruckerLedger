import PrimaryButton from '@/components/PrimaryButton';
import ScreenBackground from '@/components/ScreenBackground';

import { getShadow } from '@/constants/shadowUtils';
import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
    TypographyScale
} from '@/constants/theme';

import { useAuth } from '@/lib/auth/AuthContext';
import {
    createBackup,
    formatBytes,
    getBackupStatus,
    isAuthenticated,
} from '@/lib/backup/appwriteBackup';

import { getBOLHistory } from '@/lib/bolService';
import { getAllExpenses } from '@/lib/expenseService';
import { getTrips } from '@/lib/tripService';

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import React, { useCallback, useEffect, useState } from 'react';

import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CloudSettingsScreen() {
  const { user, logout } = useAuth();

  const [backupStatus, setBackupStatus] = useState({
    lastBackupTime: null as number | null,
    backupSize: 0,
    itemsBackedUp: 0,
  });

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);

  /* ───────────────────────────── */
  /* INIT AUTH + STATUS */
  /* ───────────────────────────── */

  useEffect(() => {
    (async () => {
      try {
        const authenticated = await isAuthenticated();
        setCloudConnected(authenticated);

        if (authenticated) {
          const status = await getBackupStatus();
          setBackupStatus(status);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      }
    })();
  }, []);

  /* ───────────────────────────── */
  /* BACKUP */
  /* ───────────────────────────── */

  const handleBackupNow = useCallback(async () => {
    if (!cloudConnected) {
      Alert.alert('Not Connected', 'Please sign in to enable cloud backup');
      return;
    }

    setIsBackingUp(true);

    try {
      const [trips, expenses, bols] = await Promise.all([
        getTrips(),
        getAllExpenses(),
        getBOLHistory(),
      ]);

      const result = await createBackup(trips, expenses, bols);

      if (result.success) {
        const freshStatus = await getBackupStatus();
        setBackupStatus(freshStatus);

        const totalItems = trips.length + expenses.length + bols.length;

        Alert.alert(
          'Backup Complete',
          `Backed up ${totalItems} items (${formatBytes(freshStatus.backupSize)})`
        );
      } else {
        Alert.alert('Backup Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Backup failed'
      );
    } finally {
      setIsBackingUp(false);
    }
  }, [cloudConnected]);

  /* ───────────────────────────── */
  /* LOGOUT */
  /* ───────────────────────────── */

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Your local data will remain on device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }, [logout]);

  /* ───────────────────────────── */
  /* HELPERS */
  /* ───────────────────────────── */

  const formatLastBackup = (timestamp: number | null) => {
    if (!timestamp) return 'Never';

    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /* ───────────────────────────── */
  /* UI */
  /* ───────────────────────────── */

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <View style={styles.container}>
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* HERO SECTION (Settings themed - Blue)                          */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          <LinearGradient
            colors={[Colors.secondary, '#5A8FB5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroSection}
          >
            {/* Top Bar */}
            <View style={styles.heroTopBar}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.heroBackBtn}
              >
                <Text style={styles.heroBackText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.heroTitle}>⚙️ Settings</Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Subtitle */}
            <View style={styles.heroSubtitleContainer}>
              <Text style={styles.heroSubtitle}>Account & Cloud Backup</Text>
            </View>
          </LinearGradient>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* FLOATING CARD (Content sections)                               */}
          {/* ═══════════════════════════════════════════════════════════════ */}

          <View style={styles.floatingCardContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.cardContent}
            >
              {/* ACCOUNT SECTION */}
              <Animated.View entering={FadeInDown}>
                <Text style={styles.cardSectionTitle}>👤 Account</Text>
                <View style={styles.cardBlock}>
                  <View style={styles.accountRow}>
                    <Text style={styles.accountLabel}>Signed in as</Text>
                    <Text style={styles.accountValue}>{user?.email || '—'}</Text>
                  </View>
                  <View style={styles.accountDivider} />
                  <View style={styles.accountRow}>
                    <Text style={styles.accountLabel}>Name</Text>
                    <Text style={styles.accountValue}>{user?.name || '—'}</Text>
                  </View>
                </View>

                <PrimaryButton
                  label="Logout"
                  onPress={handleLogout}
                  style={styles.logoutBtn}
                />
              </Animated.View>

              {/* CLOUD BACKUP SECTION */}
              <Animated.View entering={FadeInDown.delay(100)}>
                <View style={styles.cloudHeaderContainer}>
                  <Text style={styles.cardSectionTitle}>☁️ Cloud Backup</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: cloudConnected
                          ? Colors.success
                          : Colors.textMuted,
                      },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>
                      {cloudConnected ? 'Connected' : 'Offline'}
                    </Text>
                  </View>
                </View>

                {cloudConnected ? (
                  <>
                    {/* Backup Status */}
                    <View style={styles.cardBlock}>
                      <View style={styles.statusRow}>
                        <Text style={styles.statusLabel}>Last Backup</Text>
                        <Text style={styles.statusValue}>
                          {formatLastBackup(backupStatus.lastBackupTime)}
                        </Text>
                      </View>
                      <View style={styles.statusDivider} />
                      <View style={styles.statusRow}>
                        <Text style={styles.statusLabel}>Items</Text>
                        <Text style={styles.statusValue}>
                          {backupStatus.itemsBackedUp}
                        </Text>
                      </View>
                      <View style={styles.statusDivider} />
                      <View style={styles.statusRow}>
                        <Text style={styles.statusLabel}>Size</Text>
                        <Text style={styles.statusValue}>
                          {formatBytes(backupStatus.backupSize)}
                        </Text>
                      </View>
                    </View>

                    {/* Backup Button */}
                    <PrimaryButton
                      label={isBackingUp ? 'Backing up...' : 'Backup Now'}
                      onPress={handleBackupNow}
                      disabled={isBackingUp}
                    />

                    {/* Auto-backup Toggle */}
                    <View style={styles.autoBackupContainer}>
                      <View>
                        <Text style={styles.autoBackupLabel}>Auto-backup</Text>
                        <Text style={styles.autoBackupSubtitle}>
                          Weekly on WiFi
                        </Text>
                      </View>
                      <Switch
                        value={autoBackupEnabled}
                        onValueChange={setAutoBackupEnabled}
                        trackColor={{ false: Colors.borderLight, true: Colors.primary }}
                        thumbColor={autoBackupEnabled ? Colors.primary : Colors.textMuted}
                      />
                    </View>
                  </>
                ) : (
                  <View style={styles.offlineContainer}>
                    <Text style={styles.offlineIcon}>🔒</Text>
                    <Text style={styles.offlineTitle}>
                      Cloud backup optional
                    </Text>
                    <Text style={styles.offlineSubtitle}>
                      Your data stays secure on your device
                    </Text>
                  </View>
                )}
              </Animated.View>

              <View style={{ height: Spacing.xxxxl }} />
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

/* ───────────────────────────── */
/* STYLES */
/* ───────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1 },

  container: {
    flex: 1,
    position: 'relative',
  },

  // ─── HERO SECTION ───────────────────────────────────────────

  heroSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.lg,
  },

  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },

  heroBackBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroBackText: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
  },

  heroTitle: {
    ...TypographyScale.title,
    color: Colors.textInverse,
  },

  heroSubtitleContainer: {
    alignItems: 'center',
  },

  heroSubtitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // ─── FLOATING CARD ──────────────────────────────────────────

  floatingCardContainer: {
    flex: 1,
    marginTop: -Spacing.xl,
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...getShadow(Shadow.large),
  },

  cardContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxxl,
    gap: Spacing.lg,
  },

  cardSectionTitle: {
    ...TypographyScale.subtitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // ─── CARD BLOCKS ────────────────────────────────────────────

  cardBlock: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...getShadow(Shadow.small),
  },

  // ─── ACCOUNT SECTION ────────────────────────────────────────

  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  accountLabel: {
    ...TypographyScale.small,
    color: Colors.textMuted,
  },

  accountValue: {
    ...TypographyScale.body,
    color: Colors.textPrimary,
  },

  accountDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },

  logoutBtn: {
    marginTop: Spacing.md,
  },

  // ─── CLOUD BACKUP SECTION ──────────────────────────────────

  cloudHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },

  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },

  statusBadgeText: {
    ...TypographyScale.caption,
    color: Colors.textInverse,
    fontWeight: FontWeight.semibold,
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  statusLabel: {
    ...TypographyScale.small,
    color: Colors.textMuted,
  },

  statusValue: {
    ...TypographyScale.body,
    color: Colors.primary,
    fontWeight: FontWeight.semibold,
  },

  statusDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },

  autoBackupContainer: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    ...getShadow(Shadow.small),
  },

  autoBackupLabel: {
    ...TypographyScale.body,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  autoBackupSubtitle: {
    ...TypographyScale.small,
    color: Colors.textMuted,
  },

  offlineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...getShadow(Shadow.small),
  },

  offlineIcon: {
    fontSize: FontSize.largeIcon,
    marginBottom: Spacing.md,
  },

  offlineTitle: {
    ...TypographyScale.subtitle,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  offlineSubtitle: {
    ...TypographyScale.small,
    color: Colors.textMuted,
  },
});