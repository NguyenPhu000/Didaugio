import { memo, useCallback } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import Animated, {
  interpolate,
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = TOKENS.spring.snappy;
const SCROLL_THRESHOLD = 60;

function ExploreModernHeaderInner({ user, onPressSearch, scrollY }) {
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

  const titleAnimStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    const y = scrollY.value;
    const opacity = interpolate(y, [0, SCROLL_THRESHOLD], [1, 0], {
      extrapolateRight: "clamp",
    });
    const scale = interpolate(y, [0, SCROLL_THRESHOLD], [1, 0.92], {
      extrapolateRight: "clamp",
    });
    const translateY = interpolate(y, [0, SCROLL_THRESHOLD], [0, -12], {
      extrapolateRight: "clamp",
    });
    return {
      opacity,
      transform: [{ scale }, { translateY }],
    };
  });

  const subtitleAnimStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    const y = scrollY.value;
    const opacity = interpolate(y, [0, SCROLL_THRESHOLD * 0.6], [1, 0], {
      extrapolateRight: "clamp",
    });
    const height = interpolate(y, [0, SCROLL_THRESHOLD * 0.6], [1, 0], {
      extrapolateRight: "clamp",
    });
    return {
      opacity,
      transform: [{ scaleY: height }],
    };
  });

  const searchAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
  }));

  return (
    <View
      className="px-5 pt-3 pb-4"
      style={{ backgroundColor: APPLE_THEME.background }}
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center gap-3">
          <View
            className="w-12 h-12 rounded-full p-[2px]"
            style={{ backgroundColor: APPLE_THEME.focusBlue, ...TOKENS.shadow.sm }}
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
              className="text-xs font-medium"
              style={{ color: TAB_THEME.textMuted }}
            >
              {getGreeting()},
            </Text>
            <Text
              className="text-base font-semibold"
              style={{ color: APPLE_THEME.text, fontFamily: TOKENS.font.semibold }}
            >
              {userName}
            </Text>
          </View>
        </View>

        <NotificationBell size={44} />
      </View>

      <Animated.View style={[{ marginBottom: 20, overflow: "hidden" }, titleAnimStyle]}>
        <Text
          className="text-[26px] font-bold tracking-[-0.45px] leading-[32px]"
          style={{ color: APPLE_THEME.text, fontFamily: TOKENS.font.heading }}
        >
          {t("explore.header.greeting")}
        </Text>
        <Animated.Text
          className="mt-2 text-sm leading-5 font-medium"
          style={[
            subtitleAnimStyle,
            { color: TAB_THEME.textMuted, fontFamily: TOKENS.font.medium },
          ]}
        >
          {t("explore.header.subtitle")}
        </Animated.Text>
      </Animated.View>

      <AnimatedPressable
        onPress={handleSearchPress}
        onPressIn={handleSearchPressIn}
        onPressOut={handleSearchPressOut}
        style={[searchAnimStyle, TOKENS.shadow.sm]}
        className="rounded-full"
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
            className="flex-row items-center h-[52px] pl-3.5 pr-1.5"
            style={{
              backgroundColor:
                Platform.OS === "ios"
                  ? "rgba(255,255,255,0.72)"
                  : APPLE_THEME.surface,
            }}
          >
            <View className="w-8 items-center justify-center">
              <MaterialIconsRounded
                name="search"
                size={20}
                color={TAB_THEME.textMuted}
              />
            </View>
            <Text
              className="flex-1 ml-1 text-[15px] font-medium"
              style={{ color: TAB_THEME.textMuted, fontFamily: TOKENS.font.medium }}
            >
              {t("explore.header.searchPlaceholder")}
            </Text>

            <View
              className="flex-row items-center h-10 pl-3 pr-2 rounded-full gap-0.5"
              style={{ backgroundColor: APPLE_THEME.focusBlue, ...TOKENS.shadow.sm }}
            >
              <MaterialIconsRounded name="place" size={14} color={APPLE_THEME.white} />
              <Text
                className="text-white text-[13px] font-semibold"
                style={{ fontFamily: TOKENS.font.semibold }}
              >
                {t("explore.header.location")}
              </Text>
              <MaterialIconsRounded
                name="keyboard-arrow-down"
                size={14}
                color={APPLE_THEME.white}
              />
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </View>
  );
}

export const ExploreModernHeader = memo(ExploreModernHeaderInner);
