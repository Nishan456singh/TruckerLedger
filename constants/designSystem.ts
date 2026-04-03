/**
 * TruckerLedger Design System
 * Master reference for all design tokens
 * Inspired by: Apple HIG, Stripe, Uber, Figma
 *
 * This file serves as documentation and reference
 * Import actual values from constants/theme.ts
 */

import {
    BorderRadius,
    CategoryMeta,
    Colors,
    FontSize,
    FontWeight,
    Gradients,
    Shadow,
    Spacing,
    TypographyScale,
} from "@/constants/theme";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COLOR SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Semantic color tokens for consistency
 * Never hardcode colors - always use these tokens
 */
export const ColorSystem = {
  // Brand colors
  primary: Colors.primary, // #F4C21B - Bold yellow for CTAs
  secondary: Colors.secondary, // #6FA0C8 - Calm blue for trust
  accent: Colors.accent, // #C3224E - Red/pink for alerts

  // Neutrals
  background: Colors.background, // #FFFFFF - Main Background
  surface: Colors.surface, // #F8F8F8 - Secondary surface
  card: Colors.card, // #FFFFFF - Card backgrounds

  // Text
  textPrimary: Colors.textPrimary, // #111111 - Main text
  textSecondary: Colors.textSecondary, // #1A1A1A - Secondary text
  textMuted: Colors.textMuted, // #8A8A8A - Muted text
  textInverse: Colors.textInverse, // #FFFFFF - On dark backgrounds

  // Functional
  success: Colors.success, // #22C55E - Success states
  warning: Colors.warning, // #FFB84C - Warnings
  danger: Colors.danger, // #C3224E - Errors

  // Borders
  border: Colors.border, // Prominent borders
  borderLight: Colors.borderLight, // Subtle dividers
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SPACING SCALE (8-tier system)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Based on multiples of 4px (common in iOS/Material Design)
 * Ensures visual rhythm and predictable layouts
 */
export const SpacingScale = {
  xs: Spacing.xs, // 4px - Minimal spacing
  sm: Spacing.sm, // 8px - Tight spacing
  md: Spacing.md, // 12px - Standard spacing
  lg: Spacing.lg, // 16px - Comfortable spacing
  xl: Spacing.xl, // 20px - Large spacing
  xxl: Spacing.xxl, // 28px - Extra large
  xxxl: Spacing.xxxl, // 36px - Hero spacing
  xxxxl: Spacing.xxxxl, // 48px - Maximum spacing
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TYPOGRAPHY SCALE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Pre-configured text styles with perfect line heights
 * Ensures readable hierarchy across all screen sizes
 */
export const TypographyTable = {
  // Hero display numbers and large titles
  display: TypographyScale.display, // 48px / 800
  // Main page titles
  headline: TypographyScale.headline, // 36px / 800
  // Section headers
  title: TypographyScale.title, // 24px / 700
  // Card titles, important text
  subtitle: TypographyScale.subtitle, // 20px / 700
  // Default body text
  body: TypographyScale.body, // 16px / 600
  // Secondary labels, metadata
  small: TypographyScale.small, // 14px / 500
  // Captions, hints, fine print
  caption: TypographyScale.caption, // 12px / 500
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BORDER RADIUS SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Progressive rounding: sm -> md -> lg -> xl
 * Maintains modern, soft appearance
 */
export const BorderRadiusSystem = {
  sm: BorderRadius.sm, // 12px - Compact elements, small buttons
  md: BorderRadius.md, // 18px - Standard cards
  lg: BorderRadius.lg, // 24px - Medium containers
  xl: BorderRadius.xl, // 32px - Large sections, hero cards
  xxl: BorderRadius.xxl, // 36px - Maximum rounding
  full: BorderRadius.full, // 9999px - Circular elements
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SHADOW SYSTEM (11 elevation levels)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Tiered elevation for depth and hierarchy
 * Premium floating shadows inspired by Apple
 */
export const ShadowSystem = {
  small: Shadow.small, // 2px blur - Subtle cards
  card: Shadow.card, // 8px blur - Standard cards
  medium: Shadow.medium, // 8px blur - Medium elevation
  cardElevated: Shadow.cardElevated, // 12px blur - Elevated cards
  large: Shadow.large, // 16px blur - Major containers
  xl: Shadow.xl, // 24px blur - Floating sections
  button: Shadow.button, // Primary button shadow (gold)
  buttonPressed: Shadow.buttonPressed, // Pressed button shadow
  accent: Shadow.accent, // Secondary accent shadow (blue)
  danger: Shadow.danger, // Danger state shadow (red)
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ANIMATION SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Timing constants for consistent motion
 * Inspired by: iOS, Material Motion
 */
export const AnimationSystem = {
  // Durations
  instant: 0, // No animation
  fast: 150, // Quick feedback
  normal: 300, // Standard transitions
  slow: 500, // Deliberate motion
  verySlow: 800, // Extended animations

  // Delays for stagger effects
  noDelay: 0,
  tinyDelay: 25,
  smallDelay: 50,
  mediumDelay: 100,
  largeDelay: 200,

  // Common patterns
  staggerInterval: 40, // 40ms between list item animations
  pressScale: 0.97, // Scale on button press
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPONENT SIZING
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Standard sizes for consistent UI
 */
export const ComponentSizes = {
  // Button heights
  buttonSmall: 36,
  buttonMedium: 44,
  buttonLarge: 56,

  // Icon sizes
  iconSmall: 16,
  iconMedium: 24,
  iconLarge: 32,
  iconXLarge: 40,

  // Touch targets (Apple: 44x44 minimum)
  minimumTouchTarget: 44,
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RESPONSIVE BREAKPOINTS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * For tablets and larger screens
 */
export const Breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYOUT CONSTANTS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Screen-level layout guidelines
 */
export const LayoutConstants = {
  // Hero section proportions
  heroSmallHeight: 150,
  heroMediumHeight: 200,
  heroLargeHeight: 250,

  // Floating card overlap (negative margin)
  floatingCardOverlap: Spacing.xl, // 20px

  // Safe area padding
  screenPadding: Spacing.lg, // 16px
  screenPaddingLarge: Spacing.xl, // 20px
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RE-EXPORTS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * For convenience - import entire design system
 */
export { BorderRadius, CategoryMeta, Colors, FontSize, FontWeight, Gradients, Shadow, Spacing, TypographyScale };

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * USAGE EXAMPLES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * // Colors
 * backgroundColor: ColorSystem.primary,
 * color: ColorSystem.textPrimary,
 *
 * // Spacing
 * padding: SpacingScale.lg,
 * marginTop: SpacingScale.md,
 *
 * // Typography
 * ...TypographyTable.title,
 * fontSize: TypographyTable.body.fontSize,
 *
 * // Shadows
 * ...getShadow(ShadowSystem.card),
 *
 * // Animations
 * duration: AnimationSystem.normal,
 * delay: AnimationSystem.staggerInterval * index,
 *
 * // Borders
 * borderRadius: BorderRadiusSystem.lg,
 *
 * // Components
 * height: ComponentSizes.buttonLarge,
 */
