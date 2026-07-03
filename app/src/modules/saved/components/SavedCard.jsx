import { memo, useCallback, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MapPin, Star, Pencil, Heart } from "lucide-react-native";
import {
  TOKENS,
  BOOKING_APPLE_THEME as APPLE_THEME,
} from "../../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../../lib/media-url";

// Aspect ratio tạo hiệu ứng Masonry (Pinterest-style)
const getAspectRatioFromId = (id) => {
  const str = String(id || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  const ratios = [0.75, 0.85, 1.0, 1.15];
  return ratios[Math.abs(hash) % ratios.length];
};

export const SavedCard = memo(function SavedCard({
  entry,
  onPress,
  onOpenNote,
  onUnsave,
}) {
  const { t } = useTranslation();
  const place = entry?.place || entry;
  const imageUri = resolvePlaceImageUri(place);
  const ratingValue = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  const rating =
    Number.isFinite(ratingValue) && ratingValue > 0
      ? ratingValue.toFixed(1)
      : null;
  const note = String(entry?.note || "").trim();

  const imageAspectRatio = useMemo(
    () => getAspectRatioFromId(place?.id),
    [place?.id],
  );

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }, [onPress]);

  const handleNotePress = useCallback(
    (e) => {
      e?.stopPropagation?.();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onOpenNote?.(entry);
    },
    [entry, onOpenNote],
  );

  const handleUnsavePress = useCallback(
    (e) => {
      e?.stopPropagation?.();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onUnsave?.(place?.id);
    },
    [place?.id, onUnsave],
  );

  return (
    <Animated.View
      entering={FadeIn.duration(250)}
      exiting={FadeOut.duration(200)}
      layout={Layout.duration(250).springify().damping(18).stiffness(150)}
    >
      <Pressable
        onPress={handlePress}
        className="active:scale-[0.97] active:opacity-95"
      >
        {/* Khung Ảnh Hình Ảnh */}
        <View
          className="bg-[#F2F2F7] border border-black/5 shadow-sm shadow-black/5"
          style={{
            borderRadius: 18,
            borderCurve: "continuous",
            overflow: "hidden",
          }}
        >
          <View style={{ aspectRatio: imageAspectRatio }}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                // 💎 ĐÃ SỬA: Xóa className, trả lại style thuần để NativeWind không bị Crash
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={250}
                cachePolicy="memory-disk"
              />
            ) : (
              <View className="flex-1 bg-[#E5E5EA] items-center justify-center">
                <MapPin size={28} color="#C7C7CC" strokeWidth={1.5} />
              </View>
            )}
          </View>

          {/* Nhóm Nút Tương Tác (Góc trên phải) */}
          <View className="absolute top-2 right-2 flex-row gap-1.5">
            <Pressable
              onPress={handleNotePress}
              hitSlop={10}
              className="w-[30px] h-[30px] bg-white/90 items-center justify-center active:bg-white shadow-sm shadow-black/10"
              style={{ borderRadius: 15, borderCurve: "continuous" }}
            >
              <Pencil
                size={13}
                color={note ? "#FF9500" : "#636366"}
                strokeWidth={2.5}
              />
            </Pressable>
            <Pressable
              onPress={handleUnsavePress}
              hitSlop={10}
              className="w-[30px] h-[30px] bg-white/90 items-center justify-center active:bg-white shadow-sm shadow-black/10"
              style={{ borderRadius: 15, borderCurve: "continuous" }}
            >
              <Heart size={14} color="#FF3B30" fill="#FF3B30" strokeWidth={0} />
            </Pressable>
          </View>

          {/* Chỉ báo Ghi chú (Góc dưới trái) */}
          {note ? (
            <View className="absolute bottom-2 left-2 max-w-[75%]">
              <View
                className="bg-white/95 px-2.5 py-1.5 shadow-sm shadow-black/10"
                style={{ borderRadius: 10, borderCurve: "continuous" }}
              >
                <Text
                  className="text-[11px] text-[#1D1D1F] tracking-tight"
                  style={{ fontFamily: TOKENS.font.semibold }}
                  numberOfLines={1}
                >
                  {note}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Thông tin Địa điểm */}
        <View className="pt-2.5 px-0.5 pb-2">
          <Text
            className="text-[15px] leading-[20px] tracking-tight"
            style={{
              fontFamily: TOKENS.font.semibold,
              color: APPLE_THEME.text,
            }}
            numberOfLines={2}
          >
            {place?.name || t("savedCard.favoritePlace")}
          </Text>

          <View className="flex-row items-center mt-1 gap-1">
            <MapPin size={12} color={APPLE_THEME.textMuted} strokeWidth={2.5} />
            <Text
              className="text-[12px] flex-1 tracking-tight"
              style={{
                fontFamily: TOKENS.font.medium,
                color: APPLE_THEME.textMuted,
              }}
              numberOfLines={1}
            >
              {place?.address || t("savedCard.canThoVietnam")}
            </Text>
          </View>

          {rating && (
            <View className="flex-row items-center mt-1.5 gap-1">
              <Star size={12} fill="#FFB800" color="#FFB800" strokeWidth={0} />
              <Text
                className="text-[12px] tracking-tight"
                style={{
                  fontFamily: TOKENS.font.bold,
                  color: APPLE_THEME.text,
                }}
              >
                {rating}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});

export default SavedCard;
