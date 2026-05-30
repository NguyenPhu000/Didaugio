import { memo, useCallback } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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
import { getGreeting, getUserName } from "../utils/exploreHelpers";
import { resolveMediaUrl } from "../../../lib/media-url";
import { NotificationBell } from "../../../components/composed/NotificationBell";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = TOKENS.spring.snappy;
const SCROLL_THRESHOLD = 60;

function ExploreModernHeaderInner({ user, onPressSearch, scrollY }) {
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

  // Title fades out and shrinks as user scrolls
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

  // Subtitle hides faster
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

  // Search bar press scale
  const searchAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
  }));

  return (
    <View className="px-5 pt-3 pb-4" style={{ backgroundColor: APPLE_THEME.background }}>
      {/* Top Row: User & Notification */}
      <View className="flex-row justify-between items-center mb-5">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-full p-[2px] bg-[#007AFF] shadow-sm elevation-2">
            <View className="w-11 h-11 rounded-full bg-[#F1F5F9] items-center justify-center overflow-hidden">
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ width: 44, height: 44, borderRadius: 22 }} />
              ) : (
                <MaterialIcons
                  name="person"
                  size={24}
                  color={APPLE_THEME.textSoft}
                />
              )}
            </View>
          </View>
          <View>
            <Text className="text-xs text-[#54647A] font-medium">{getGreeting()},</Text>
            <Text className="text-[16px] text-[#1D1D1F] font-semibold">{userName}</Text>
          </View>
        </View>

        <NotificationBell size={44} />
      </View>

      {/* Title - animated */}
      <Animated.View style={[{ marginBottom: 22, overflow: "hidden" }, titleAnimStyle]}>
        <Text className="text-[26px] text-[#1D1D1F] font-bold tracking-[-0.45px] leading-[32px]">Bạn muốn khám phá gì hôm nay?</Text>
        <Animated.Text
          className="mt-2 text-[#54647A] text-sm leading-[20px] font-medium"
          style={subtitleAnimStyle}
        >
          Chọn danh mục, xem địa điểm nổi bật và bắt đầu hành trình tại Cần
          Thơ.
        </Animated.Text>
      </Animated.View>

      {/* Search Bar - Pill Shape with Glass Effect */}
      <AnimatedPressable
        onPress={handleSearchPress}
        onPressIn={handleSearchPressIn}
        onPressOut={handleSearchPressOut}
        style={[searchAnimStyle]}
        className="rounded-full shadow-sm elevation-1"
      >
        <View className="rounded-full overflow-hidden border border-black/[0.06] relative">
          <BlurView
            intensity={Platform.OS === "ios" ? 40 : 20}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          <View
            className="flex-row items-center h-[54px] pl-3.5 pr-1.5"
            style={{
              backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.92)",
            }}
          >
            <View className="w-8 items-center justify-center">
              <MaterialIcons
                name="search"
                size={20}
                color={APPLE_THEME.textMuted}
              />
            </View>
            <Text className="flex-1 ml-1 text-[15px] text-[#54647A] font-medium">
              Tìm địa điểm, món ăn, hoạt động...
            </Text>

            {/* Location Button */}
            <View className="flex-row items-center bg-[#007AFF] h-[42px] pl-3 pr-2.5 rounded-full gap-0.75 shadow-sm elevation-1">
              <MaterialIcons name="place" size={14} color="#FFF" />
              <Text className="text-white text-[13px] font-semibold">Cần Thơ</Text>
              <MaterialIcons name="keyboard-arrow-down" size={14} color="#FFF" />
            </View>
          </View>
        </View>
      </AnimatedPressable>
    </View>
  );
}

export const ExploreModernHeader = memo(ExploreModernHeaderInner);
