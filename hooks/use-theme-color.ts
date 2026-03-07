/**
 * Simplified theme hook for a forced dark-mode app.
 * Props are accepted for API compatibility with legacy components.
 */
import { Colors } from '@/constants/theme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  _colorName?: string
) {
  // Always fallback to dark since the app is dark-only
  return props.dark ?? Colors.textPrimary;
}
