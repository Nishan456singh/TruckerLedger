import { Colors } from "@/constants/theme";
import { ReactNode } from "react";
import {
  ImageBackground,
  StyleSheet,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

const bgImage = require("@/assets/images/login.png");

interface ScreenBackgroundProps {
  children: ReactNode;
}

export default function ScreenBackground({ children }: ScreenBackgroundProps) {
  return (
    <ImageBackground
      source={bgImage}
      style={styles.container}
      resizeMode="cover"
      blurRadius={6}
    >
      {/* Dark cinematic overlay */}
      <LinearGradient
        colors={[
          "rgba(8,10,15,0.96)",
          "rgba(10,12,18,0.92)",
          "rgba(12,15,22,0.96)",
        ]}
        style={styles.overlay}
      />

      {/* Radial glow effect */}
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
  },

  glowOne: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: "rgba(255,255,255,0.04)",
    top: -120,
    left: -120,
  },

  glowTwo: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "rgba(255,255,255,0.03)",
    bottom: -160,
    right: -160,
  },
});