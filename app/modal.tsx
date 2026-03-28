import { router } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BorderRadius, Colors, Shadow, Spacing, TypographyScale } from "@/constants/theme";

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText
        style={[
          styles.title,
          {
            ...TypographyScale.headline,
            color: Colors.textPrimary,
          },
        ]}
      >
        Modal Dialog
      </ThemedText>

      <ThemedText
        style={[
          styles.description,
          {
            ...TypographyScale.body,
            color: Colors.textMuted,
          },
        ]}
      >
        Choose an action below to proceed
      </ThemedText>

      <TouchableOpacity
        onPress={() => router.back()}
        style={[styles.actionButton, Shadow.button]}
        activeOpacity={0.85}
      >
        <ThemedText
          style={[
            styles.buttonText,
            {
              ...TypographyScale.subtitle,
              color: Colors.textPrimary,
            },
          ]}
        >
          Return to Home
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },

  title: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },

  description: {
    marginBottom: Spacing.xl,
    textAlign: "center",
    maxWidth: 280,
  },

  actionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 220,
  },

  buttonText: {
    fontWeight: "700",
  },
});