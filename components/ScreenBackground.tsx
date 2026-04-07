import { Colors } from "@/constants/theme";
import { ReactNode } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";

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
      blurRadius={4}
    >
      <View style={styles.overlay} pointerEvents="none" />
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
    backgroundColor: "rgba(255, 255, 255, 0.91)",
  },
});
