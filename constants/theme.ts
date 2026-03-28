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
  surfaceAlt: '#FAF7F8',     // Soft alt surface for secondary cards
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
  borderLight: 'rgba(0,0,0,0.06)',     // Lighter borders for subtle dividers
  borderTiny: 'rgba(0,0,0,0.04)',      // Minimal borders
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

// Color utilities with opacity variants
export const ColorUtilities = {
  accentLight10: '#C3224E19',   // Primary 10% opacity
  accentLight20: '#C3224E33',   // Primary 20% opacity
  successLight: 'rgba(34, 197, 94, 0.1)',
  dangerLight: 'rgba(220, 38, 38, 0.1)',
  warningLight: 'rgba(255, 180, 76, 0.1)',
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
  // Soft, premium floating shadows - tiered system
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  cardElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
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

// Typography scale with line heights for premium readability
export const TypographyScale = {
  display: { fontSize: 48, lineHeight: 52, fontWeight: '800' as const },      // Hero numbers
  headline: { fontSize: 36, lineHeight: 40, fontWeight: '800' as const },     // Big titles
  title: { fontSize: 24, lineHeight: 28, fontWeight: '700' as const },        // Section headers
  subtitle: { fontSize: 20, lineHeight: 24, fontWeight: '700' as const },     // Card titles
  body: { fontSize: 16, lineHeight: 20, fontWeight: '600' as const },         // Default text
  small: { fontSize: 14, lineHeight: 17, fontWeight: '500' as const },        // Secondary labels
  caption: { fontSize: 12, lineHeight: 15, fontWeight: '500' as const },      // Metadata
};

// Modal and special component gradients
export const ModalGradients = {
  yellowGradient: ['#FFE5B4', '#FFD99B'],    // For Add Receipt modal
  blueGradient: ['#E5F4FF', '#D4EAFF'],      // For Add BOL modal
};
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

  // Modal gradients (alternative - can also use ModalGradients constant)
  modalYellow: ['#FFE5B4', '#FFD99B'],      // Add Receipt modal
  modalBlue: ['#E5F4FF', '#D4EAFF'],        // Add BOL modal
};
