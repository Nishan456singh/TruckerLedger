/**
 * Standard spring animation configuration for tap feedback
 * Used across button and interactive components
 */
export const SPRING_CONFIGS = {
  standard: { damping: 15, stiffness: 300 },
  bouncy: { damping: 10, stiffness: 400 },
  smooth: { damping: 20, stiffness: 200 },
};

/**
 * Standard scale values for button press feedback
 */
export const SCALE_VALUES = {
  press: 0.92,
  normal: 1,
};
