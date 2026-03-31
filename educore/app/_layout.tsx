import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { StudentAppProvider } from "@/lib/student-app/context";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StudentAppProvider>
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: {
              backgroundColor: "#F5F1E8",
            },
            headerTintColor: "#2A3C31",
            contentStyle: {
              backgroundColor: "#F5F1E8",
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="join" options={{ headerShown: false }} />
          <Stack.Screen
            name="result"
            options={{ title: "Results", headerBackVisible: false }}
          />
        </Stack>
      </StudentAppProvider>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
