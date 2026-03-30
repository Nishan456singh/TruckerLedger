import { Platform } from 'react-native';

/**
 * Returns platform-appropriate shadow styles.
 * On web: returns boxShadow (CSS property)
 * On native: returns React Native shadow properties
 * This eliminates the "shadow* style props are deprecated" warning on web.
 */
export function getShadow(shadowObj: any) {
  if (Platform.OS === 'web') {
    return {
      boxShadow: shadowObj.boxShadow,
    };
  }
  // On native platforms, use React Native shadow properties
  return {
    shadowColor: shadowObj.shadowColor,
    shadowOffset: shadowObj.shadowOffset,
    shadowOpacity: shadowObj.shadowOpacity,
    shadowRadius: shadowObj.shadowRadius,
    elevation: shadowObj.elevation,
  };
}
