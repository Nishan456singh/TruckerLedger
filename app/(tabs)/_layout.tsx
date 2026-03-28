import { Colors } from "@/constants/theme";
import { Stack } from "expo-router";

export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          animation: "none",
        }}
      />

      <Stack.Screen
        name="explore"
        options={{
          animation: "none",
        }}
      />
    </Stack>
  );
}