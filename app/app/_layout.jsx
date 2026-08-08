import "../global.css";
import i18n, { resolveLanguage } from "../src/i18n";
import { useEffect, useRef, useState } from "react";
import { View, AppState } from "react-native";
import safeAsyncStorage from "../src/utils/safeAsyncStorage";
import { Stack, useRouter, useSegments, usePathname } from "expo-router";
import { PENDING_PAYMENT_BOOKING_KEY } from "../src/modules/booking/hooks/usePayment";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme } from "nativewind";
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
import { GlobalAlert } from "../src/components/composed/GlobalAlert";
import { isMobileUserRole } from "../src/modules/auth/utils/authRoleAccess";
import { logger } from "../src/lib/logger";
import CinematicSplash from "../src/components/splash/CinematicSplash";
import { SPLASH_TIMING } from "../src/components/splash/cinematicSplashTiming";

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
      } catch (error) {
        logger.warn("[PaymentRecovery] Failed to restore pending payment:", error);
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

function ThemeSyncManager() {
  const { setColorScheme } = useColorScheme();
  const themePreference = useUIStore((state) => state.themePreference || "auto");
  const appliedPreferenceRef = useRef(null);

  useEffect(() => {
    if (!['auto', 'light', 'dark'].includes(themePreference)) return;
    if (appliedPreferenceRef.current === themePreference) return;

    appliedPreferenceRef.current = themePreference;
    setColorScheme(themePreference === "auto" ? "system" : themePreference);
  }, [setColorScheme, themePreference]);

  return null;
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  
  // Tráº¡ng thÃ¡i Hydration tá»« cáº£ 2 store
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

  const [bootstrapDeadlineReached, setBootstrapDeadlineReached] = useState(false);
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);

  // Giá»›i háº¡n pháº§n chá» hydration trÆ°á»›c video Ä‘á»ƒ trÃ¡nh "mÃ n chá» trÆ°á»›c mÃ n chá»".
  useEffect(() => {
    const timer = setTimeout(() => {
      setBootstrapDeadlineReached(true);
    }, SPLASH_TIMING.BOOTSTRAP_DEADLINE_MS);
    return () => clearTimeout(timer);
  }, []);

  // Ã‰p i18n nháº­n diá»‡n ngÃ´n ngá»¯ ngay khi uiStore vá»«a Ä‘á»c xong tá»« AsyncStorage
  useEffect(() => {
    if (isUiHydrated && userLanguage) {
      const resolved = resolveLanguage(userLanguage);
      if (i18n.language !== resolved) {
        i18n.changeLanguage(resolved);
      }
    }
  }, [isUiHydrated, userLanguage]);

  // Luá»“ng tÃ­nh toÃ¡n tráº¡ng thÃ¡i Sáºµn SÃ ng cuá»‘i cÃ¹ng
  const isStoreReady = isAuthHydrated && isUiHydrated;
  const isFontReady = fontsLoaded || fontError;
  const isReady =
    (isStoreReady && isFontReady) || bootstrapDeadlineReached;

  useEffect(() => {
    if (!isReady || nativeSplashHidden) return undefined;

    let active = true;
    SplashScreen.hideAsync()
      .catch(() => {})
      .finally(() => {
        if (active) setNativeSplashHidden(true);
      });

    return () => {
      active = false;
    };
  }, [isReady, nativeSplashHidden]);

  useEffect(() => {
    if (!isStoreReady && !bootstrapDeadlineReached) return;

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
  }, [isStoreReady, bootstrapDeadlineReached, accessToken, user, clearSession, isGuest, segments, hasOnboarded, router]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#02030A" }}>
      <StatusBar
        style={splashFinished ? "dark" : "light"}
        translucent
        backgroundColor="transparent"
      />
      <SafeAreaProvider>
        <KeyboardProvider>
          <AppProvider>
            <ThemeSyncManager />
            <I18nInitializer>
              {isReady && (
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
              )}

              {!splashFinished ? (
                <CinematicSplash
                  active={nativeSplashHidden}
                  ready={isReady}
                  onFinish={() => setSplashFinished(true)}
                />
              ) : null}
            </I18nInitializer>
          </AppProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
