import { memo, useCallback, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { MapPin, Star, Pencil, Heart } from "lucide-react-native";
import {
  TOKENS,
  BOOKING_APPLE_THEME as APPLE_THEME,
} from "../../../constants/design-tokens";
import {
  resolvePlaceImageUri,
  PLACE_IMAGE_BLURHASH,
} from "../../../lib/media-url";

// Aspect ratio tạo nhịp điệu thị giác Masonry tự nhiên (Pinterest-style)
const getAspectRatioFromId = (id) => {
  const str = String(id || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.trunc(Math.imul(hash, 31) + str.charCodeAt(i));
  }
  const ratios = [0.84, 0.96, 1.08];
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
  const categoryName = place?.category?.name || place?.categoryName || null;
  const districtName =
    place?.district?.name || place?.ward?.district?.name || null;

  const imageAspectRatio = useMemo(
    () => getAspectRatioFromId(place?.id),
    [place?.id],
  );

  // 1:1 Apple-style fluid press physics
  const cardScale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handlePressIn = useCallback(() => {
    cardScale.value = withSpring(0.97, TOKENS.spring.press);
  }, [cardScale]);

  const handlePressOut = useCallback(() => {
    cardScale.value = withSpring(1, TOKENS.spring.press);
  }, [cardScale]);

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
      // Tactile double-spring bounce on heart
      heartScale.value = withSequence(
        withSpring(1.3, { damping: 10, stiffness: 220 }),
        withSpring(1, { damping: 14, stiffness: 180 }),
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onUnsave?.(place?.id);
    },
    [heartScale, onUnsave, place?.id],
  );

  return (
    <Animated.View
      entering={FadeIn.duration(240)}
      exiting={FadeOut.duration(180)}
      layout={Layout.duration(240).springify().damping(18).stiffness(160)}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={cardAnimatedStyle}>
          {/* Khung Ảnh với góc squircle liên tục */}
          <View
            className="bg-[#E9ECF0] border-[0.5px] border-black/[0.06] shadow-sm shadow-black/[0.04]"
            style={{
              borderRadius: 20,
              borderCurve: "continuous",
              overflow: "hidden",
            }}
          >
            <View style={{ aspectRatio: imageAspectRatio }}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  placeholder={{ blurhash: PLACE_IMAGE_BLURHASH }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  transition={250}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View className="flex-1 bg-[#EEF2F6] items-center justify-center">
                  <MapPin size={26} color="#A0AAB5" strokeWidth={1.6} />
                </View>
              )}
            </View>

            {/* Category Chip (Góc trên trái) */}
            {categoryName ? (
              <View className="absolute top-2.5 left-2.5">
                <View
                  className="px-2 py-0.5 border-[0.5px] border-white/20"
                  style={{
                    backgroundColor: "rgba(20, 24, 30, 0.65)",
                    borderRadius: 10,
                    borderCurve: "continuous",
                  }}
                >
                  <Text
                    className="text-[10px] text-white tracking-tight"
                    style={{ fontFamily: TOKENS.font.medium }}
                    numberOfLines={1}
                  >
                    {categoryName}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Nhóm Nút Tương Tác Kính Mờ (Góc trên phải) */}
            <View className="absolute top-2.5 right-2.5 flex-row items-center gap-1.5">
              <Pressable
                onPress={handleNotePress}
                hitSlop={8}
                className="w-8 h-8 items-center justify-center border-[0.5px] border-black/[0.08] shadow-sm shadow-black/10 active:opacity-80"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.92)",
                  borderRadius: 16,
                  borderCurve: "continuous",
                }}
              >
                <Pencil
                  size={13}
                  color={note ? "#FF9F0A" : "#636366"}
                  strokeWidth={2.4}
                />
                {note ? (
                  <View
                    className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#FF9F0A] rounded-full"
                  />
                ) : null}
              </Pressable>

              <Pressable
                onPress={handleUnsavePress}
                hitSlop={8}
                className="w-8 h-8 items-center justify-center border-[0.5px] border-black/[0.08] shadow-sm shadow-black/10 active:opacity-80"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.92)",
                  borderRadius: 16,
                  borderCurve: "continuous",
                }}
              >
                <Animated.View style={heartAnimatedStyle}>
                  <Heart
                    size={14}
                    color="#FF3B30"
                    fill="#FF3B30"
                    strokeWidth={0}
                  />
                </Animated.View>
              </Pressable>
            </View>

            {/* Chỉ báo Ghi chú (Góc dưới trái) */}
            {note ? (
              <View className="absolute bottom-2.5 left-2.5 max-w-[85%]">
                <View
                  className="flex-row items-center gap-1 px-2.5 py-1 border-[0.5px] border-black/[0.06] shadow-sm shadow-black/10"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.94)",
                    borderRadius: 12,
                    borderCurve: "continuous",
                  }}
                >
                  <Pencil size={9} color="#FF9F0A" strokeWidth={2.5} />
                  <Text
                    className="text-[11px] text-[#1D1D1F] tracking-tight flex-1"
                    style={{ fontFamily: TOKENS.font.medium }}
                    numberOfLines={1}
                  >
                    {note}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Thông tin Địa điểm (Editorial Typography) */}
          <View className="pt-2 px-1 pb-1">
            <Text
              className="text-[14.5px] leading-[19px] tracking-tight text-[#1D1D1F]"
              style={{ fontFamily: TOKENS.font.semibold }}
              numberOfLines={2}
            >
              {place?.name || t("savedCard.favoritePlace")}
            </Text>

            <View className="flex-row items-center mt-1 gap-1">
              <MapPin size={11} color="#8E8E93" strokeWidth={2.2} />
              <Text
                className="text-[11.5px] flex-1 text-[#8E8E93] tracking-tight"
                style={{ fontFamily: TOKENS.font.medium }}
                numberOfLines={1}
              >
                {districtName || place?.address || t("savedCard.canThoVietnam")}
              </Text>
            </View>

            {!!rating && (
              <View className="flex-row items-center mt-1 gap-1">
                <Star size={11} fill="#FF9F0A" color="#FF9F0A" strokeWidth={0} />
                <Text
                  className="text-[11.5px] text-[#1D1D1F] tracking-tight"
                  style={{ fontFamily: TOKENS.font.semibold }}
                >
                  {rating}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

export default SavedCard;
