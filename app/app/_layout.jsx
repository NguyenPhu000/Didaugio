import "../global.css";
import { useEffect } from "react";
import { View, Alert } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";

// Tat strict mode canh bao doc/ghi shared value truc tiep trong render cycle vi mot so thu vien ben thu ba (nhu bottom-sheet, draggable-flatlist) chua cap nhat tuong thich.
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});
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
import { ToastContainer } from "../src/components/composed/ToastContainer";
import { useAuthStore } from "../src/stores/authStore";
import { useUIStore } from "../src/stores/uiStore";
import { useOfflineSync } from "../src/modules/trips/hooks/useTripsOffline";
import { useAlertStore } from "../src/stores/alertStore";
import { GlobalAlert } from "../src/components/composed/GlobalAlert";

SplashScreen.preventAutoHideAsync();

function OfflineSyncManager() {
  useOfflineSync();
  return null;
}

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
    const originalAlert = Alert.alert;

    Alert.alert = (title, message, buttons, options) => {
      let type = "info";
      const combinedText = `${title || ""} ${message || ""}`.toLowerCase();

      if (
        combinedText.includes("lỗi") ||
        combinedText.includes("thất bại") ||
        combinedText.includes("không thể") ||
        combinedText.includes("error") ||
        combinedText.includes("failed") ||
        combinedText.includes("thiếu") ||
        combinedText.includes("bắt buộc") ||
        combinedText.includes("chưa nhập")
      ) {
        type = "error";
      } else if (
        combinedText.includes("thành công") ||
        combinedText.includes("đã lưu") ||
        combinedText.includes("đã xóa") ||
        combinedText.includes("success") ||
        combinedText.includes("saved") ||
        combinedText.includes("hoàn tất")
      ) {
        type = "success";
      } else if (
        combinedText.includes("cảnh báo") ||
        combinedText.includes("warning") ||
        combinedText.includes("chú ý") ||
        combinedText.includes("lưu ý")
      ) {
        type = "warning";
      } else if (
        combinedText.includes("chắc chắn") ||
        combinedText.includes("xác nhận") ||
        combinedText.includes("bạn có muốn") ||
        combinedText.includes("bạn có chắc") ||
        combinedText.includes("chắc chắn muốn") ||
        (buttons && buttons.length > 1)
      ) {
        type = "confirm";
      }

      let mappedButtons = [];
      if (buttons && buttons.length > 0) {
        mappedButtons = buttons.map((btn) => ({
          text: btn.text,
          onPress: () => {
            useAlertStore.getState().hideAlert();
            btn.onPress?.();
          },
          style:
            btn.style === "cancel"
              ? "cancel"
              : btn.style === "destructive"
              ? "destructive"
              : "default",
        }));
      } else {
        mappedButtons = [
          {
            text: "Đóng",
            onPress: () => useAlertStore.getState().hideAlert(),
            style: "default",
          },
        ];
      }

      useAlertStore.getState().showAlert({
        title,
        message,
        type,
        buttons: mappedButtons,
        options,
      });
    };

    return () => {
      Alert.alert = originalAlert;
    };
  }, []);

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
    const inEventDetail = rootSegment === "event";
    const inExploreStack = rootSegment === "explore";
    const isPublicRoute = inPublicTabs || inPlaceDetail || inEventDetail || inExploreStack;
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
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <SafeAreaProvider>
        <KeyboardProvider>
          <AppProvider>
            <OfflineSyncManager />
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
                    name="event/[id]"
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
                {segments[0] !== "(auth)" && <AIFloatingButton />}
                <OfflineToast />
                <GlobalAlert />
                <ToastContainer />
              </BottomSheetModalProvider>
            </View>
          </AppProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
