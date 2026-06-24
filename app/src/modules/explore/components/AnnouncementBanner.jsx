import { memo, useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { TOKENS } from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { formatDayMonthNumeric } from "@/utils/dateFormat";

function AnnouncementBannerInner({ announcement }) {
  const [dismissed, setDismissed] = useState(false);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Ẩn hoàn toàn nếu không có thông báo
  if (!announcement || dismissed) return null;

  const handleDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    opacity.value = withTiming(0, { duration: 250 });
    translateY.value = withTiming(-8, { duration: 250 }, () => {
      runOnJS(setDismissed)(true);
    });
  }, [opacity, translateY]);

  // Format ngày tháng gọn
  const dateText = announcement.sentAt
    ? formatDayMonthNumeric(announcement.sentAt)
    : null;

  return (
    <Animated.View style={[animatedStyle, { paddingHorizontal: TAB_SCREEN_PADDING }]} className="mt-3">
      <View className="rounded-[16px] overflow-hidden border border-[#0071E3]/20 bg-[#0071E3]/[0.06] px-4 py-3 flex-row items-start gap-3">
        {/* Icon */}
        <View className="w-8 h-8 rounded-full bg-[#0071E3]/15 items-center justify-center mt-0.5 shrink-0">
          <Text className="text-[15px]">!</Text>
        </View>

        {/* Nội dung */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-0.5">
            <Text
              className="text-[#0071E3] text-[12px] font-bold tracking-wider"
              style={{ fontFamily: TOKENS.font.bold }}
            >
              THONG BAO HE THONG
            </Text>
            {dateText ? (
              <Text
                className="text-black/40 text-[10px]"
                style={{ fontFamily: TOKENS.font.medium }}
              >
                {dateText}
              </Text>
            ) : null}
          </View>
          <Text
            className="text-[#1D1D1F] text-[13px] font-semibold leading-[18px]"
            style={{ fontFamily: TOKENS.font.semibold }}
            numberOfLines={1}
          >
            {announcement.title}
          </Text>
          {announcement.body ? (
            <Text
              className="text-black/56 text-[12px] mt-0.5 leading-[17px]"
              style={{ fontFamily: TOKENS.font.medium }}
              numberOfLines={2}
            >
              {announcement.body}
            </Text>
          ) : null}
        </View>

        {/* Nút dismiss */}
        <Pressable
          onPress={handleDismiss}
          hitSlop={12}
          className="w-6 h-6 rounded-full bg-black/[0.06] items-center justify-center shrink-0 mt-0.5"
        >
          <Text className="text-black/40 text-[14px] leading-[14px]">×</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export const AnnouncementBanner = memo(AnnouncementBannerInner);
