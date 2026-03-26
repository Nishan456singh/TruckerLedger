import * as Haptics from 'expo-haptics';

/**
 * Provide haptic feedback for button tap
 * Uses medium impact for consistency across all interactive elements
 */
export async function pressHaptic(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

/**
 * Provide light haptic feedback for subtle interactions
 */
export async function lightHaptic(): Promise<void> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/**
 * Provide strong haptic feedback for successful actions
 */
export async function successHaptic(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Provide error haptic feedback for failures
 */
export async function errorHaptic(): Promise<void> {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
