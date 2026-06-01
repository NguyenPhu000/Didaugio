import { memo, useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import Animated, { FadeInRight, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { cn } from "../../../../lib/cn";
import { TOKENS, BOOKING_APPLE_THEME as APPLE_THEME } from "../../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../../lib/media-url";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const T = {
  ink: APPLE_THEME.text,
  canvas: APPLE_THEME.surface,
  parchment: APPLE_THEME.background,
  muted48: APPLE_THEME.textMuted,
  primary: APPLE_THEME.primary,
  onPrimary: APPLE_THEME.white,
};

// Bọc memo cho từng Chip để tránh re-render toàn bộ lưới khi chọn/bỏ chọn
const SavedPlaceChip = memo(({ entry, selected, onToggle, index }) => {
  const place = entry?.place || entry;
  const placeId = place?.id;
  const scale = useSharedValue(1);
  const imageUri = resolvePlaceImageUri(place);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, TOKENS.spring.press);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, TOKENS.spring.press);
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle?.(placeId);
  }, [placeId, onToggle]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!placeId) return null;

  return (
    <Animated.View entering={FadeInRight.delay(index * 40).duration(300)}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={cn(
          "flex-row items-center h-10 pl-1 pr-3 rounded-[20px] bg-white border gap-1.5 max-w-[170px]",
          selected ? "border-primary bg-black/[0.02]" : "border-black/[0.06]",
        )}
        style={animStyle}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} className="w-8 h-8 rounded-full bg-background" contentFit="cover" transition={150} />
        ) : (
          <View className="w-8 h-8 rounded-full bg-background items-center justify-center">
            <MaterialIconsRounded name="place" size={16} color={T.muted48} />
          </View>
        )}

        <Text
          className={cn(
            "flex-1 text-[13px] font-semibold tracking-tight",
            selected ? "text-primary" : "text-ink",
          )}
          numberOfLines={1}
        >
          {place?.name || "Địa điểm"}
        </Text>

        {selected && (
          <View className="w-4 h-4 rounded-[8px] bg-primary items-center justify-center">
            <MaterialIconsRounded name="check" size={10} color={T.onPrimary} />
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
});

function SavedPlacesGridInner({
  savedPlaces,
  selectedIds = [],
  targetDay = 1,
  isLoading,
  isError,
  onToggle,
}) {
  if (isLoading) {
    return (
      <View className="py-1">
        <View className="flex-row gap-2">
          {[0, 1, 2].map((i) => (
            <View key={i} className="w-[110px] h-10 rounded-[20px] bg-background" />
          ))}
        </View>
      </View>
    );
  }

  if (isError || !savedPlaces || savedPlaces.length === 0) {
    return (
      <View className="items-center py-6 gap-1.5">
        <View className="w-12 h-12 rounded-[24px] bg-background items-center justify-center mb-0.5">
          <MaterialIconsRounded name={isError ? "cloud-off" : "bookmark-border"} size={22} color={T.muted48} />
        </View>
        <Text className="text-sm font-semibold tracking-tight" style={{ color: T.ink }}>
          {isError ? "Không thể tải dữ liệu" : "Chưa có địa điểm đã lưu"}
        </Text>
        <Text className="text-xs font-body text-center leading-4 px-8" style={{ color: T.muted48 }}>
          {isError ? "Vui lòng kiểm tra kết nối và thử lại" : "Hãy lưu những địa điểm yêu thích để lên lịch trình nhanh hơn"}
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        {savedPlaces.map((entry, index) => {
          const place = entry?.place || entry;
          const isSelected = selectedIds.map(String).includes(String(place?.id));
          return (
            <SavedPlaceChip
              key={`${entry?.id || place?.id}-${index}`}
              entry={entry}
              selected={isSelected}
              onToggle={onToggle}
              index={index}
            />
          );
        })}
      </View>

      {selectedIds.length > 0 && (
        <Animated.View entering={FadeInRight.duration(200)} className="flex-row items-center gap-1.5 pt-0.5 px-1">
          <MaterialIconsRounded name="check-circle" size={14} color={T.primary} />
          <Text className="text-xs font-medium tracking-tight" style={{ color: T.primary }}>
            Đã chọn {selectedIds.length} địa điểm cho ngày {targetDay}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

export const SavedPlacesGrid = memo(SavedPlacesGridInner);