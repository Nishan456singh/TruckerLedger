import {
    BorderRadius,
    Colors,
    FontSize,
    FontWeight,
    Shadow,
    Spacing,
} from '@/constants/theme';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ReceiptPreviewProps {
  uri: string;
  onRemove?: () => void;
  onPress?: () => void;
  compact?: boolean;
}

export default function ReceiptPreview({
  uri,
  onRemove,
  onPress,
  compact = false,
}: ReceiptPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.compactContainer} activeOpacity={0.85}>
        {!error ? (
          <Image
            source={{ uri }}
            style={styles.compactImage}
            contentFit="cover"
            onLoadEnd={() => setLoading(false)}
            onError={() => { setError(true); setLoading(false); }}
          />
        ) : (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>📄</Text>
          </View>
        )}
        {loading && !error && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        )}
        <View style={styles.compactBadge}>
          <Text style={styles.compactBadgeText}>Receipt</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Receipt</Text>
      <View style={styles.imageWrapper}>
        {!error ? (
          <Image
            source={{ uri }}
            style={styles.image}
            contentFit="contain"
            onLoadEnd={() => setLoading(false)}
            onError={() => { setError(true); setLoading(false); }}
          />
        ) : (
          <View style={styles.errorBox}>
            <Text style={styles.errorIcon}>📄</Text>
            <Text style={styles.errorMsg}>Receipt unavailable</Text>
          </View>
        )}
        {loading && !error && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      </View>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.removeButton} activeOpacity={0.8}>
          <Text style={styles.removeText}>Remove Receipt</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  imageWrapper: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 200,
    ...Shadow.card,
  },
  image: {
    width: '100%',
    height: 260,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  errorBox: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  errorIcon: {
    fontSize: 40,
  },
  errorText: {
    fontSize: 28,
  },
  errorMsg: {
    fontSize: FontSize.caption,
    color: Colors.textSecondary,
  },
  removeButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  removeText: {
    fontSize: FontSize.caption,
    color: Colors.danger,
    fontWeight: FontWeight.medium,
  },

  // Compact
  compactContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  compactImage: {
    width: 64,
    height: 64,
  },
  compactBadge: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  compactBadgeText: {
    fontSize: 8,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
});
