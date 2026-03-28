// TruckLedger Premium Design System
// Inspired by modern, high-end mobile UI with bright premium colors

export const Colors = {
  // Premium primary colors
  primary: '#F4C21B',        // Bold yellow - action, CTAs, primary
  primaryHover: '#E8B107',   // Darker yellow for press state
  secondary: '#6FA0C8',      // Calm blue - hero sections, trust
  accent: '#C3224E',         // Red/pink - alerts, losses, high-energy

  // Neutral palette
  background: '#FFFFFF',
  surface: '#F8F8F8',
  card: '#FFFFFF',
  cardAlt: '#F8F8F8',
  cardStrong: '#F0F0F0',

  // Text hierarchy
  textPrimary: '#111111',     // Deep black
  textSecondary: '#1A1A1A',   // Soft dark
  textMuted: '#8A8A8A',       // Muted neutral
  textInverse: '#FFFFFF',     // For dark backgrounds

  // Utility
  border: 'rgba(0,0,0,0.08)',
  danger: '#C3224E',
  warning: '#FFB84C',
  success: '#22C55E',
  overlay: 'rgba(255, 255, 255, 0.85)',

  // Category colors (updated for premium feel)
  fuel: '#FF8C42',
  toll: '#2E7DFF',
  parking: '#A78BFA',
  food: '#00D09E',
  repair: '#C3224E',
  other: '#8A8A8A',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
  xxxxl: 48,
};

export const FontSize = {
  hero: 48,        // Large hero titles
  title: 36,       // Main screen titles
  section: 24,     // Section headers
  subsection: 20,  // Subsection headers
  body: 16,        // Regular body text
  caption: 14,     // Secondary text
  small: 12,       // Meta text
  tiny: 11,        // Smallest text
  largeIcon: 40,
  headerIcon: 28,
  statIcon: 24,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const BorderRadius = {
  sm: 12,      // Small pills, compact elements
  md: 18,      // Standard cards
  lg: 24,      // Medium containers
  xl: 32,      // Large sections
  xxl: 36,     // Hero cards
  full: 9999,  // Circular
};

export const Shadow = {
  // Soft, premium floating shadows
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  button: {
    shadowColor: '#F4C21B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonPressed: {
    shadowColor: '#F4C21B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  accent: {
    shadowColor: '#6FA0C8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  danger: {
    shadowColor: '#C3224E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
};

// Category metadata
export const CategoryMeta: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  fuel: { label: 'Fuel', icon: '⛽', color: Colors.fuel },
  toll: { label: 'Toll', icon: '🛣️', color: Colors.toll },
  parking: { label: 'Parking', icon: '🅿️', color: Colors.parking },
  food: { label: 'Food', icon: '🍔', color: Colors.food },
  repair: { label: 'Repair', icon: '🔧', color: Colors.repair },
  other: { label: 'Other', icon: '📦', color: Colors.other },
};

export const CATEGORIES = Object.keys(CategoryMeta) as Category[];

export type Category = 'fuel' | 'toll' | 'parking' | 'food' | 'repair' | 'other';

// Gradient definitions for hero sections
export const Gradients = {
  bluePrimary: ['#6FA0C8', '#5A8FB5'],      // Blue gradient
  yellowPrimary: ['#F4C21B', '#E8B107'],    // Yellow gradient
  pinkAccent: ['#C3224E', '#A01A40'],       // Pink/Red gradient
};
