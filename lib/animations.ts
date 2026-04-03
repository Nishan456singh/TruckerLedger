/**
 * TruckerLedger Animation System
 * Micro-interactions inspired by Apple HIG + Stripe + Uber
 * Uses react-native-reanimated for performant animations
 */

import {
    FadeInDown,
    FadeInUp,
    FadeOut,
    SlideInLeft,
    SlideInRight,
    SpringifyConfig,
    ZoomIn
} from "react-native-reanimated";

// ═══════════════════════════════════════════════════════════════════════════
// ENTRY ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fade in down - Hero sections, headers, top-aligned cards
 * Delay and stagger for list items
 */
export const enterFadeDown = (delay?: number) =>
  FadeInDown.duration(300).delay(delay || 0);

/**
 * Fade in up - Content from bottom, CTAs, floating buttons
 */
export const enterFadeUp = (delay?: number) =>
  FadeInUp.duration(300).delay(delay || 0);

/**
 * Scale + Fade - Card entrances, modals, pop-ups
 */
export const enterScale = (delay?: number) =>
  ZoomIn.duration(300).delay(delay || 0);

/**
 * Slide in left - Side-by-side content, transitions
 */
export const enterSlideLeft = (delay?: number) =>
  SlideInLeft.duration(250).delay(delay || 0);

/**
 * Slide in right - Side-by-side content, transitions
 */
export const enterSlideRight = (delay?: number) =>
  SlideInRight.duration(250).delay(delay || 0);

/**
 * Staggered list animation
 * Apply to each item: enterFadeDown.delay(index * 40)
 */
export const staggerDelay = (index: number, interval: number = 40) =>
  interval * index;

// ═══════════════════════════════════════════════════════════════════════════
// EXIT ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const exitFade = () => FadeOut.duration(200);

// ═══════════════════════════════════════════════════════════════════════════
// INTERACTION ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Press scale animation - For buttons and touchable elements
 * Scale down to 0.97 on press
 */
export const useButtonPressScale = () => {
  return {
    activeOpacity: 0.7,
  };
};

/**
 * Card lift animation - Subtle elevation on press
 * Use with Animated.createAnimatedComponent(View)
 */
export const cardPressStyle = {
  activeOpacity: 0.8,
};

// ═══════════════════════════════════════════════════════════════════════════
// TIMING CONSTANTS (ms)
// ═══════════════════════════════════════════════════════════════════════════

export enum AnimationDuration {
  instant = 0,
  fast = 150,
  normal = 300,
  slow = 500,
  verySlow = 800,
}

export enum AnimationDelay {
  none = 0,
  tiny = 25,
  small = 50,
  medium = 100,
  large = 200,
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION CONFIGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Spring animation - Used for iOS-style bouncy interactions
 */
export const springConfig: SpringifyConfig = {
  damping: 0.8,
  mass: 1.0,
  overshootClamping: false,
};

/**
 * Stagger config for lists
 * Apply: items.map((item, i) => enterFadeDown(staggerDelay(i)))
 */
export const listStaggerConfig = {
  itemDelay: 40,
  maxItems: 10, // Limit stagger for performance
};

// ═══════════════════════════════════════════════════════════════════════════
// PRESET ANIMATIONS (Ready to use)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hero section animation
 * Large fade-in with slight delay
 */
export const heroAnimation = FadeInDown.duration(400).delay(100);

/**
 * Floating card animation
 * Subtle scale + fade from below
 */
export const floatingCardAnimation = FadeInUp.duration(350).delay(150);

/**
 * Button animation
 * Quick and responsive
 */
export const buttonAnimation = FadeInUp.duration(200);

/**
 * List item animation
 * Use index to create stagger: .delay(index * 50)
 */
export const listItemAnimation = (index: number) =>
  FadeInDown.duration(300).delay(index * 50);

/**
 * Modal entrance
 * Dramatic but quick
 */
export const modalAnimation = ZoomIn.duration(300);

/**
 * Sheet animation (bottom sheet entrance)
 */
export const sheetAnimation = FadeInUp.duration(350).delay(100);

// ═══════════════════════════════════════════════════════════════════════════
// REUSABLE ANIMATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create staggered animations for arrays
 * @example const animations = createStaggeredAnimations(5, 40)
 * Then use: animations[index]
 */
export const createStaggeredAnimations = (
  count: number,
  delayIncrease: number = 40
) => {
  return Array.from({ length: count }, (_, i) =>
    enterFadeDown(i * delayIncrease)
  );
};

/**
 * Apply animation with custom delay to any animation
 */
export const withDelay = (duration: number, delay: number) => {
  return { duration, delay };
};

/**
 * Haptic + Visual feedback pattern
 * Used for critical actions
 */
export enum HapticPattern {
  light = "light",
  medium = "medium",
  heavy = "heavy",
  success = "success",
  warning = "warning",
  error = "error",
}

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE TIPS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Native driver animations (GPU-accelerated)
 * Recommended for: scale, opacity, rotation
 * NOT recommended: layout changes, width/height
 *
 * Usage:
 * const animation = useSharedValue(0);
 * const animatedStyle = useAnimatedStyle(() => ({
 *   transform: [{ scale: animation.value }],
 * }), [animation]);
 */
export const useNativeDriver = true;

/**
 * Reduce animations on low-end devices
 * Check device performance before using heavy animations
 */
export const shouldReduceAnimations = (devicePerformance: "high" | "low") =>
  devicePerformance === "low";
