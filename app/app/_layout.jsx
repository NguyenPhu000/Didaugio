import "../global.css";
import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from "@expo-google-fonts/be-vietnam-pro";
import { AppProvider } from "../src/providers/AppProvider";
import { OfflineToast } from "../src/components/composed/OfflineToast";
import { AIFloatingButton } from "../src/components/composed/AIFloatingButton";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
              <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
              <Stack.Screen
                name="place/[id]"
                options={{ animation: "slide_from_right" }}
              />
              <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
            </Stack>
            <AIFloatingButton />
            <OfflineToast />
          </View>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
