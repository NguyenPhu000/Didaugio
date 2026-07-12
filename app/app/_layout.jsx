import "../global.css";
import i18n, { resolveLanguage } from "../src/i18n";
import { useEffect, useRef, useState } from "react";
import { View, Alert, AppState } from "react-native";
import safeAsyncStorage from "../src/utils/safeAsyncStorage";
import { Stack, useRouter, useSegments, usePathname } from "expo-router";
import { PENDING_PAYMENT_BOOKING_KEY } from "../src/modules/booking/hooks/usePayment";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";
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
import { I18nInitializer } from "../src/providers/I18nInitializer";
import { OfflineToast } from "../src/components/composed/OfflineToast";
import { AIFloatingButton } from "../src/components/composed/AIFloatingButton";
import { ToastContainer } from "../src/components/composed/ToastContainer";
import { useAuthStore } from "../src/stores/authStore";
import { useUIStore } from "../src/stores/uiStore";
import { useOfflineSync } from "../src/modules/trips/hooks/useTripsOffline";
import { useAlertStore } from "../src/stores/alertStore";
import { GlobalAlert } from "../src/components/composed/GlobalAlert";
import { isMobileUserRole } from "../src/modules/auth/utils/authRoleAccess";

// Tat strict mode canh bao doc/ghi shared value truc tiep trong render cycle vi mot so thu vien ben thu ba (nhu bottom-sheet, draggable-flatlist) chua cap nhat tuong thich.
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

SplashScreen.preventAutoHideAsync();

function PaymentRecoveryListener() {
  const router = useRouter();
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextState) => {
      if (nextState !== "active") return;
      if (isProcessingRef.current) return;

      try {
        const pendingBookingId = await safeAsyncStorage.getItem(PENDING_PAYMENT_BOOKING_KEY);

        // Validate: non-empty and valid bookingId (positive integer string)
        if (
          pendingBookingId &&
          /^\d+$/.test(pendingBookingId) &&
          Number(pendingBookingId) > 0
        ) {
          isProcessingRef.current = true;
          await safeAsyncStorage.removeItem(PENDING_PAYMENT_BOOKING_KEY);
          router.replace(
            `/payment/result?status=pending_verify&bookingId=${pendingBookingId}`
          );
        }
      } catch {
        // silent
      } finally {
        isProcessingRef.current = false;
      }
    });
    return () => subscription.remove();
  }, [router]);

  return null;
}

function OfflineSyncManager() {
  useOfflineSync();
  return null;
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  
  // Trạng thái Hydration từ cả 2 store
  const isAuthHydrated = useAuthStore((s) => s.isHydrated);
  const isUiHydrated = useUIStore((s) => s.isHydrated);
  const userLanguage = useUIStore((s) => s.language);
  
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
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

  const [timeoutReady, setTimeoutReady] = useState(false);

  // Phanh cứu hộ chống đứng màn hình Splash Screen (2.5 giây)
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutReady(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Ép i18n nhận diện ngôn ngữ ngay khi uiStore vừa đọc xong từ AsyncStorage
  useEffect(() => {
    if (isUiHydrated && userLanguage) {
      const resolved = resolveLanguage(userLanguage);
      if (i18n.language !== resolved) {
        i18n.changeLanguage(resolved);
      }
    }
  }, [isUiHydrated, userLanguage]);

  // Luồng tính toán trạng thái Sẵn Sàng cuối cùng
  const isStoreReady = isAuthHydrated && isUiHydrated;
  const isFontReady = fontsLoaded || fontError;
  const isReady = (isStoreReady && isFontReady) || timeoutReady;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  useEffect(() => {
    const originalAlert = Alert.alert;

    Alert.alert = (title, message, buttons, options) => {
      let type = "info";
      const combinedText = `${title || ""} ${message || ""}`.toLowerCase();

      // Detect error type (Vietnamese + English)
      if (
        combinedText.includes("lỗi") ||
        combinedText.includes("thất bại") ||
        combinedText.includes("không thể") ||
        combinedText.includes("error") ||
        combinedText.includes("failed") ||
        combinedText.includes("thiếu") ||
        combinedText.includes("bắt buộc") ||
        combinedText.includes("chưa nhập") ||
        combinedText.includes("could not") ||
        combinedText.includes("cannot") ||
        combinedText.includes("required") ||
        combinedText.includes("missing")
      ) {
        type = "error";
      } else if (
        // Detect success type
        combinedText.includes("thành công") ||
        combinedText.includes("đã lưu") ||
        combinedText.includes("đã xóa") ||
        combinedText.includes("success") ||
        combinedText.includes("saved") ||
        combinedText.includes("hoàn tất") ||
        combinedText.includes("deleted") ||
        combinedText.includes("completed")
      ) {
        type = "success";
      } else if (
        // Detect warning type
        combinedText.includes("cảnh báo") ||
        combinedText.includes("warning") ||
        combinedText.includes("chú ý") ||
        combinedText.includes("lưu ý")
      ) {
        type = "warning";
      } else if (
        // Detect confirm type
        combinedText.includes("chắc chắn") ||
        combinedText.includes("xác nhận") ||
        combinedText.includes("bạn có muốn") ||
        combinedText.includes("bạn có chắc") ||
        combinedText.includes("chắc chắn muốn") ||
        combinedText.includes("are you sure") ||
        combinedText.includes("confirm") ||
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
            text: i18n.t("common.close"),
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
    if (!isStoreReady && !timeoutReady) return;

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
    const hasInvalidMobileRole = Boolean(accessToken && user && !isMobileUserRole(user));

    if (hasInvalidMobileRole) {
      clearSession();
      router.replace("/(auth)/login");
      return;
    }

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
  }, [isStoreReady, timeoutReady, accessToken, user, clearSession, isGuest, segments, hasOnboarded, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <SafeAreaProvider>
        <KeyboardProvider>
          <AppProvider>
            <I18nInitializer>
              {isReady ? (
                <>
                  <OfflineSyncManager />
                  <PaymentRecoveryListener />
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
                          options={{ animation: "slide_from_right", gestureEnabled: false }}
                        />
                        <Stack.Screen
                          name="payment/checkout"
                          options={{ animation: "slide_from_right" }}
                        />
                        <Stack.Screen
                          name="payment/result"
                          options={{ animation: "fade" }}
                        />
                        <Stack.Screen
                          name="onboarding"
                          options={{ animation: "fade" }}
                        />
                        <Stack.Screen
                          name="ai/chat"
                          options={{ animation: "slide_from_right" }}
                        />
                      </Stack>
                      {segments[0] !== "(auth)" && <AIFloatingButton router={router} pathname={pathname} />}
                      <OfflineToast />
                      <GlobalAlert />
                      <ToastContainer />
                    </BottomSheetModalProvider>
                  </View>
                </>
              ) : null}
            </I18nInitializer>
          </AppProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
