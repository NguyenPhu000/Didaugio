import "../global.css";
import { useEffect } from "react";
import { View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  useFonts,
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from "@expo-google-fonts/be-vietnam-pro";
import {
  Afacad_400Regular,
  Afacad_500Medium,
  Afacad_600SemiBold,
  Afacad_700Bold,
} from "@expo-google-fonts/afacad";
import { AppProvider } from "../src/providers/AppProvider";
import { OfflineToast } from "../src/components/composed/OfflineToast";
import { AIFloatingButton } from "../src/components/composed/AIFloatingButton";
import { useAuthStore } from "../src/stores/authStore";
import { useUIStore } from "../src/stores/uiStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isGuest = useAuthStore((s) => s.isGuest);
  const hasOnboarded = useUIStore((s) => s.hasOnboarded);

  const [fontsLoaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    Afacad_400Regular,
    Afacad_500Medium,
    Afacad_600SemiBold,
    Afacad_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!isHydrated) return;

    const rootSegment = segments[0];
    const childSegment = segments[1];
    const inAuthGroup = rootSegment === "(auth)";
    const inOnboarding = rootSegment === "onboarding";
    const inPublicTabs =
      rootSegment === "(tabs)" &&
      (childSegment === "map" || childSegment === "explore");
    const inPlaceDetail = rootSegment === "place";
    const inExploreStack = rootSegment === "explore";
    const isPublicRoute = inPublicTabs || inPlaceDetail || inExploreStack;
    const isLoggedIn = !!accessToken || isGuest;

    if (!isLoggedIn && !inAuthGroup && !isPublicRoute) {
      router.replace("/(auth)/login");
      return;
    }

    if (isLoggedIn && inAuthGroup) {
      if (!hasOnboarded && accessToken) {
        router.replace("/onboarding");
      } else {
        router.replace("/(tabs)/map");
      }
      return;
    }

    if (isLoggedIn && !inOnboarding && !hasOnboarded && accessToken) {
      router.replace("/onboarding");
    }
  }, [isHydrated, accessToken, isGuest, segments, hasOnboarded, router]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <AppProvider>
            <View style={{ flex: 1 }}>
              <BottomSheetModalProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(auth)" options={{ animation: "fade" }} />
                  <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
                  <Stack.Screen
                    name="place/[id]"
                    options={{ animation: "slide_from_right" }}
                  />
                  <Stack.Screen
                    name="profile/settings"
                    options={{ animation: "slide_from_right" }}
                  />
                  <Stack.Screen
                    name="profile/bookings"
                    options={{ animation: "slide_from_right" }}
                  />
                  <Stack.Screen
                    name="profile/notifications"
                    options={{ animation: "slide_from_right" }}
                  />
                  <Stack.Screen
                    name="profile/booking/[id]"
                    options={{ animation: "slide_from_right" }}
                  />
                  <Stack.Screen
                    name="onboarding"
                    options={{ animation: "fade" }}
                  />
                </Stack>
                <AIFloatingButton />
                <OfflineToast />
              </BottomSheetModalProvider>
            </View>
          </AppProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
