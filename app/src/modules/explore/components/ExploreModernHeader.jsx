import { memo, useCallback } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_THEME } from "../../../../app/(tabs)/tabTheme";
import { getGreeting, getUserName } from "../utils/exploreHelpers";
import { resolveMediaUrl } from "../../../lib/media-url";
import { NotificationBell } from "../../../components/composed/NotificationBell";

const SPRING_CONFIG = TOKENS.spring.snappy;

function ExploreModernHeaderInner({ user, onPressSearch }) {
  const { t } = useTranslation();
  const searchScale = useSharedValue(1);
  const userName = getUserName(user);
  const avatarUri = resolveMediaUrl(
    user?.profile?.avatar || user?.avatar || user?.avatarURL || user?.photoURL,
  );

  const handleSearchPressIn = useCallback(() => {
    searchScale.value = withSpring(0.97, SPRING_CONFIG);
  }, [searchScale]);

  const handleSearchPressOut = useCallback(() => {
    searchScale.value = withSpring(1, SPRING_CONFIG);
  }, [searchScale]);

  const handleSearchPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressSearch?.();
  }, [onPressSearch]);

  const searchAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
  }));

  return (
    <View
      className="px-5 pt-3 pb-4"
      style={{
        backgroundColor: APPLE_THEME.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(0,0,0,0.06)",
      }}
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-3">
          <View
            className="w-12 h-12 rounded-full p-[2px]"
            style={{
              backgroundColor: APPLE_THEME.focusBlue,
              ...TOKENS.shadow.sm,
            }}
          >
            <View
              className="w-11 h-11 rounded-full items-center justify-center overflow-hidden"
              style={{ backgroundColor: APPLE_THEME.surfaceElevated }}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  contentFit="cover"
                  style={{ width: 44, height: 44, borderRadius: 22 }}
                />
              ) : (
                <MaterialIconsRounded
                  name="person"
                  size={24}
                  color={TAB_THEME.textSoft}
                />
              )}
            </View>
          </View>
          <View>
            <Text
              className="text-xs font-semibold tracking-wide"
              style={{
                color: TAB_THEME.textMuted,
                fontFamily: TOKENS.font.semibold,
              }}
            >
              {getGreeting()},
            </Text>
            <Text
              className="text-[17px] font-bold tracking-tight"
              style={{
                color: APPLE_THEME.text,
                fontFamily: TOKENS.font.bold,
              }}
            >
              {userName}
            </Text>
          </View>
        </View>

        <NotificationBell size={44} />
      </View>

      <Animated.View
        style={[searchAnimStyle, TOKENS.shadow.sm]}
        className="rounded-full"
      >
        <Pressable
          onPress={handleSearchPress}
          onPressIn={handleSearchPressIn}
          onPressOut={handleSearchPressOut}
          className="rounded-full"
          style={{ opacity: 1 }}
          unstable_pressDelay={0}
        >
          <View
            className="rounded-full overflow-hidden relative"
            style={{ borderWidth: 1, borderColor: APPLE_THEME.borderSoft }}
          >
            <BlurView
              intensity={Platform.OS === "ios" ? 48 : 24}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
            <View
              className="flex-row items-center h-[52px] px-4"
              style={{
                backgroundColor:
                  Platform.OS === "ios"
                    ? "rgba(255,255,255,0.72)"
                    : APPLE_THEME.surface,
              }}
            >
              <MaterialIconsRounded
                name="search"
                size={20}
                color={TAB_THEME.textMuted}
              />
              <Text
                className="flex-1 ml-2 text-[15px] font-medium"
                style={{
                  color: TAB_THEME.textMuted,
                  fontFamily: TOKENS.font.medium,
                }}
                numberOfLines={1}
              >
                {t("explore.header.searchPlaceholder")}
              </Text>

              <Pressable
                className="w-9 h-9 rounded-full items-center justify-center ml-1"
                style={{ backgroundColor: APPLE_THEME.focusBlue }}
                onPress={handleSearchPress}
              >
                <MaterialIconsRounded
                  name="tune"
                  size={18}
                  color={APPLE_THEME.white}
                />
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export const ExploreModernHeader = memo(ExploreModernHeaderInner);
