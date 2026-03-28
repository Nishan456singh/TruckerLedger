import HighContrastCard from '@/components/HighContrastCard';
import PrimaryButton from '@/components/PrimaryButton';
import ScreenBackground from '@/components/ScreenBackground';
import { Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
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
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function CloudSettingsScreen() {
  const { user, logout } = useAuth();
  const [backupStatus, setBackupStatus] = useState({
    lastBackupTime: null as number | null,
    backupSize: 0,
    itemsBackedUp: 0,
    isDriving: false,
  });
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);

  // Check authentication on mount
  React.useEffect(() => {
    async function checkAuth() {
      const authenticated = await isAuthenticated();
      setCloudConnected(authenticated);
      if (authenticated) {
        const status = await getBackupStatus();
        setBackupStatus(status);
      }
    }
    checkAuth();
  }, []);

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
        // Get fresh backup status
        const freshStatus = await getBackupStatus();
        setBackupStatus(freshStatus);

        const itemCount = trips.length + expenses.length + bols.length;
        Alert.alert(
          'Backup Complete',
          `Backed up ${itemCount} items (${formatBytes(freshStatus.backupSize)})`
        );
      } else {
        Alert.alert('Backup Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Backup failed');
    } finally {
      setIsBackingUp(false);
    }
  }, [cloudConnected]); // Remove backupStatus dependency

  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Logout',
      'Are you sure? Your local data stays on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
          style: 'destructive',
        },
      ]
    );
  }, [logout]);

  const formatLastBackup = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScreenBackground>
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Animated.View entering={FadeInDown} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>⚙️ Settings</Text>
          <View style={{ width: 48 }} />
        </Animated.View>

        {/* Account Section */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <HighContrastCard>
            <Text style={styles.sectionTitle}>👤 Account</Text>
            <View style={styles.accountInfo}>
              <Text style={styles.label}>Signed in as</Text>
              <Text style={styles.value}>{user?.email}</Text>
              <Text style={styles.name}>{user?.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>
          </HighContrastCard>
        </Animated.View>

        {/* Cloud Backup Section */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <HighContrastCard>
            <View style={styles.cloudHeader}>
              <Text style={styles.sectionTitle}>☁️ Cloud Backup</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: cloudConnected ? Colors.primary : Colors.textMuted },
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
                <View style={styles.statusInfo}>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Last Backup</Text>
                    <Text style={styles.statusValue}>
                      {formatLastBackup(backupStatus.lastBackupTime)}
                    </Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Items</Text>
                    <Text style={styles.statusValue}>{backupStatus.itemsBackedUp}</Text>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Size</Text>
                    <Text style={styles.statusValue}>
                      {formatBytes(backupStatus.backupSize)}
                    </Text>
                  </View>
                </View>

                {/* Backup Now Button */}
                <PrimaryButton
                  label={isBackingUp ? 'Backing up...' : 'Backup Now'}
                  onPress={handleBackupNow}
                  loading={isBackingUp}
                  disabled={isBackingUp}
                  style={styles.backupBtn}
                />

                {/* Auto Backup Toggle */}
                <View style={styles.autoBackupToggle}>
                  <View>
                    <Text style={styles.autoBackupLabel}>Auto-backup</Text>
                    <Text style={styles.autoBackupSubtitle}>
                      Weekly backup (when WiFi available)
                    </Text>
                  </View>
                  <Switch
                    value={autoBackupEnabled}
                    onValueChange={setAutoBackupEnabled}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={autoBackupEnabled ? Colors.primary : Colors.textMuted}
                  />
                </View>

                {/* Info */}
                <View style={styles.infoBox}>
                  <Text style={styles.infoIcon}>ℹ️</Text>
                  <Text style={styles.infoText}>
                    Your local data is always your source of truth. Cloud backups are optional.
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.offlineInfo}>
                <Text style={styles.offlineIcon}>🔒</Text>
                <Text style={styles.offlineTitle}>Cloud backup is optional</Text>
                <Text style={styles.offlineSubtitle}>
                  Your data stays local on this device. Sign in to enable cloud backup.
                </Text>
              </View>
            )}
          </HighContrastCard>
        </Animated.View>

        {/* App Info Section */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <HighContrastCard>
            <Text style={styles.sectionTitle}>ℹ️ App Info</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>Version</Text>
              <Text style={styles.infoItemValue}>1.0.0</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>Storage Method</Text>
              <Text style={styles.infoItemValue}>Local SQLite + Cloud</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoItemLabel}>Data Policy</Text>
              <Text style={styles.infoItemValue}>Offline-first, optional sync</Text>
            </View>
          </HighContrastCard>
        </Animated.View>

        <View style={{ height: Spacing.xxxl }} />
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
  content: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  backBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: FontSize.title,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  title: {
    fontSize: FontSize.section + 2,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  cloudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: Colors.background,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
  },
  accountInfo: {
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  value: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.bold,
  },
  name: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  logoutBtn: {
    paddingVertical: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    color: Colors.background,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.body,
  },
  statusInfo: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statusItem: {
    flex: 1,
    backgroundColor: Colors.cardStrong,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusLabel: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  statusValue: {
    fontSize: FontSize.body,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  backupBtn: {
    marginBottom: Spacing.lg,
  },
  autoBackupToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.cardStrong,
    borderRadius: 8,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  autoBackupLabel: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  autoBackupSubtitle: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.cardStrong,
    borderRadius: 8,
    padding: Spacing.md,
    gap: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  infoIcon: {
    fontSize: FontSize.body + 2,
  },
  infoText: {
    flex: 1,
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  offlineInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  offlineIcon: {
    fontSize: 48,
  },
  offlineTitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  offlineSubtitle: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoItemLabel: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  infoItemValue: {
    fontSize: FontSize.body - 1,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
});
