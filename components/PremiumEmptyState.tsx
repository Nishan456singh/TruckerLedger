import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BorderRadius,
  Colors,
  FontSize,
  FontWeight,
  Spacing,
} from '@/constants/theme';

interface PremiumEmptyStateProps {
  icon?: string;           // emoji like "📭"
  title: string;           // Main heading
  description?: string;    // Subtitle/helper text
  action?: {
    label: string;
    onPress: () => void;
  };
}

export default function PremiumEmptyState({
  icon = '📭',
  title,
  description,
  action,
}: PremiumEmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <Text style={styles.icon}>{icon}</Text>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Description */}
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}

        {/* Action Button */}
        {action && (
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.75}
            onPress={action.onPress}
          >
            <Text style={styles.buttonText}>{action.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  content: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  icon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.subsection,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: FontSize.body,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
