/**
 * PressableScale Component
 * Adds tactile press feedback (scale animation) inspired by iOS
 * Improves UX with immediate visual feedback
 */

import React, { ReactNode } from "react";
import {
    Pressable,
    StyleSheet,
    ViewStyle,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from "react-native-reanimated";

interface PressableScaleProps {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  scaleValue?: number;
  springConfig?: { damping?: number; mass?: number };
  style?: ViewStyle;
  haptic?: boolean;
}

export default function PressableScale({
  children,
  onPress,
  disabled = false,
  scaleValue = 0.97,
  springConfig = { damping: 0.8, mass: 1.0 },
  style,
  haptic = false,
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(scaleValue, springConfig);
    if (haptic) {
      // haptic feedback would go here
      // import * as Haptics from 'expo-haptics';
      // Haptics.selectionAsync();
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={styles.pressable}
    >
      <Animated.View
        style={[
          styles.container,
          animatedStyle,
          style,
          disabled && styles.disabled,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    overflow: "visible",
  },

  container: {
    overflow: "hidden",
  },

  disabled: {
    opacity: 0.5,
  },
});
