// TruckerLedger Design System

export const Colors = {
  primary: '#22C55E',
  background: '#FFFFFF',
  card: '#F8F9FA',
  cardAlt: '#F0F3F7',
  cardStrong: '#E8EBF0',
  accent: '#38BDF8',
  danger: '#FF5A5F',
  warning: '#FFB84C',
  textPrimary: '#0B1220',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  overlay: 'rgba(255, 255, 255, 0.85)',

  // Category colors
  fuel: '#FF8C42',
  toll: '#2E7DFF',
  parking: '#A78BFA',
  food: '#00D09E',
  repair: '#FF5A5F',
  other: '#9AA0AA',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const FontSize = {
  title: 28,
  section: 20,
  body: 16,
  caption: 13,
  small: 11,
  largeIcon: 36,
  headerIcon: 24,
  statIcon: 20,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  accent: {
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
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
