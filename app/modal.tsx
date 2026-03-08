import { router } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">This is a modal</ThemedText>

      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.link}
        activeOpacity={0.7}
      >
        <ThemedText type="link">Go to home screen</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});