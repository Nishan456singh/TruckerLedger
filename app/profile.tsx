import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
} from '@/constants/theme';
import { useAuth } from '@/lib/auth/AuthContext';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View style={avatarStyles.circle}>
      <Text style={avatarStyles.text}>{initials}</Text>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '30',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
});

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [photoError, setPhotoError] = useState(false);

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  }

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <Animated.View entering={FadeInDown.springify()} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </Animated.View>

      {/* Avatar + identity */}
      <Animated.View
        entering={FadeInDown.delay(80).springify()}
        style={styles.identityCard}
      >
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

        <View style={styles.identityText}>
          <Text style={styles.name}>{user.name}</Text>
          {user.email ? <Text style={styles.email}>{user.email}</Text> : null}
        </View>
      </Animated.View>

      {/* Account info rows */}
      <Animated.View
        entering={FadeInDown.delay(160).springify()}
        style={styles.infoCard}
      >
        <InfoRow icon="🪪" label="Account ID" value={user.id.slice(0, 16) + '…'} />
        {user.email ? (
          <>
            <View style={styles.divider} />
            <InfoRow icon="✉️" label="Email" value={user.email} />
          </>
        ) : null}
        <View style={styles.divider} />
        <InfoRow
          icon="🔐"
          label="Auth Provider"
          value={user.provider === 'apple' ? 'Apple' : 'Google'}
        />
      </Animated.View>

      {/* Sign out */}
      <Animated.View
        entering={FadeInDown.delay(240).springify()}
        style={styles.signOutSection}
      >
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutIcon}>↪</Text>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={infoRowStyles.row}>
      <Text style={infoRowStyles.icon}>{icon}</Text>
      <View style={infoRowStyles.text}>
        <Text style={infoRowStyles.label}>{label}</Text>
        <Text style={infoRowStyles.value} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  icon: { fontSize: 18 },
  text: { flex: 1 },
  label: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  value: {
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    fontWeight: FontWeight.medium,
  },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
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
  headerTitle: {
    flex: 1,
    fontSize: FontSize.section,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  // Identity
  identityCard: {
    margin: Spacing.xl,
    marginTop: Spacing.sm,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.primary + '60',
  },
  identityText: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: FontSize.section - 2,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  email: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },

  // Info card
  infoCard: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.card,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },

  // Sign out
  signOutSection: {
    margin: Spacing.xl,
    marginTop: Spacing.xxl,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.danger + '18',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.danger + '40',
  },
  signOutIcon: {
    fontSize: 18,
    color: Colors.danger,
  },
  signOutText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.danger,
    letterSpacing: 0.3,
  },
});
