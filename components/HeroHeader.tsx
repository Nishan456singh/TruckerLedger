import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '@/constants/theme';
import {
    LinearGradient,
} from 'expo-linear-gradient';
import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';

interface HeroHeaderProps {
  title: string;
  subtitle?: string;
  gradient?: { colors: string[]; start?: { x: number; y: number }; end?: { x: number; y: number } };
  icon?: string;
  height?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export default function HeroHeader({
  title,
  subtitle,
  gradient = { colors: [Colors.secondary, '#5A8FB5'] },
  icon,
  height = 200,
  children,
  style,
}: HeroHeaderProps) {
  return (
    <LinearGradient
      colors={gradient.colors}
      start={gradient.start || { x: 0, y: 0 }}
      end={gradient.end || { x: 1, y: 1 }}
      style={[styles.container, { height }, style]}
    >
      <View style={styles.content}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  content: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    fontSize: FontSize.largeIcon,
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});
