/**
 * Theme Context System
 * Supports light/dark mode with system detection and persistence
 * Inspired by: Apple, Stripe, Uber
 */

import { Colors as LightColors } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  colors: typeof LightColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Dark mode color palette
 */
const DarkColors = {
  // Premium primary colors (adjusted for dark)
  primary: "#FFD700", // Brighter yellow on dark
  primaryHover: "#F4C21B",
  secondary: "#4A7BA7", // Darker blue
  accent: "#E85B7C", // Brighter pink

  // Neutral palette (dark mode)
  background: "#0F0F0F",
  surface: "#1A1A1A",
  surfaceAlt: "#222222",
  card: "#181818",
  cardAlt: "#1F1F1F",
  cardStrong: "#2A2A2A",

  // Text hierarchy (inverted)
  textPrimary: "#FFFFFF",
  textSecondary: "#E8E8E8",
  textMuted: "#A0A0A0",
  textInverse: "#0F0F0F",

  // Utility
  border: "rgba(255, 255, 255, 0.08)",
  borderLight: "rgba(255, 255, 255, 0.06)",
  borderTiny: "rgba(255, 255, 255, 0.04)",
  danger: "#E85B7C",
  warning: "#FFB84C",
  success: "#3ECF8E",
  overlay: "rgba(0, 0, 0, 0.85)",

  // Category colors (adjusted for dark)
  fuel: "#FF9D57",
  toll: "#4A9FFF",
  parking: "#C4A9FF",
  food: "#3FE5BC",
  repair: "#E85B7C",
  other: "#A0A0A0",
};

/**
 * Theme Provider Component
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>("light");
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem("theme_preference");
        if (saved === "dark" || saved === "light") {
          setMode(saved);
        } else if (systemColorScheme === "dark") {
          setMode("dark");
        }
      } catch (err) {
        console.error("Failed to load theme:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [systemColorScheme]);

  const setTheme = async (newMode: ThemeMode) => {
    setMode(newMode);
    try {
      await AsyncStorage.setItem("theme_preference", newMode);
    } catch (err) {
      console.error("Failed to save theme:", err);
    }
  };

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setTheme(newMode);
  };

  const colors = mode === "dark" ? DarkColors : LightColors;

  const value: ThemeContextType = {
    mode,
    colors,
    isDark: mode === "dark",
    toggleTheme,
    setTheme,
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme throughout the app
 * @example const { colors, isDark, toggleTheme } = useTheme()
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(
      "useTheme must be used within ThemeProvider. Wrap your app with <ThemeProvider>"
    );
  }
  return context;
};

/**
 * Hook for theme-aware styling
 * Automatically updates when theme changes
 */
export const useThemedStyle = <T extends object>(
  lightStyle: T,
  darkStyle: T
): T => {
  const { isDark } = useTheme();
  return isDark ? darkStyle : lightStyle;
};

/**
 * Hook to get colors that automatically switch
 */
export const useThemedColors = () => {
  const { colors } = useTheme();
  return colors;
};
