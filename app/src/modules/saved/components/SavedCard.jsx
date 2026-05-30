import { memo } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  CATEGORY_COLORS,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { resolvePlaceImageUri } from "../../../lib/media-url";
import {
  formatPriceLabel,
  formatReviewLabel,
  getCategorySlug,
  getLocationText,
  getReviewCount,
} from "../utils/savedHelpers";

export const SavedCard = memo(function SavedCard({
  entry,
  onPress,
  onOpenNote,
  onUnsave,
  unsaveDisabled,
}) {
  const place = entry?.place || entry;
  const imageUri = resolvePlaceImageUri(place);
  const category = place?.category?.name ?? place?.categoryName ?? "Địa điểm";
  const accent = CATEGORY_COLORS[getCategorySlug(place)] ?? CATEGORY_COLORS.default;
  const ratingValue = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  const hasRating = Number.isFinite(ratingValue) && ratingValue > 0;
  const reviewLabel = formatReviewLabel(getReviewCount(place));
  const priceLabel = formatPriceLabel(place);
  const collectionName = String(entry?.collectionName || "").trim();
  const note = String(entry?.note || "").trim();
  const locationText = getLocationText(place);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="bg-white rounded-[24px] p-3.5 gap-3 shadow-sm elevation-2"
      style={{ marginHorizontal: TAB_SCREEN_PADDING }}
    >
      <View className="flex-row gap-3.5">
        <View className="w-24 h-24 rounded-[18px] overflow-hidden bg-[#F2F2F7] relative">
          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.15)"]}
                className="absolute inset-0"
              />
            </>
          ) : (
            <View
              className="flex-1 items-center justify-center"
              style={{ backgroundColor: `${accent}1A` }}
            >
              <MaterialIcons name="place" size={28} color={accent} />
            </View>
          )}
          {hasRating ? (
            <View className="absolute left-2 top-2 flex-row items-center gap-0.5 px-2 py-1 rounded-full bg-white/95">
              <MaterialIcons name="star" size={11} color="#FF9F0A" />
              <Text className="text-[#1D1D1F] text-[11px] font-semibold tracking-[-0.1px]">{ratingValue.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        <View className="flex-1 gap-1.5 justify-center">
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 text-[#1D1D1F] text-[17px] font-semibold tracking-[-0.4px] leading-[22px]" numberOfLines={1}>
              {place?.name || "Địa điểm đã lưu"}
            </Text>
            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
          </View>

          <View className="flex-row items-center gap-1.25">
            <MaterialIcons
              name="place"
              size={13}
              color={APPLE_THEME.textMuted}
            />
            <Text className="shrink text-[#54647A] text-[13px] tracking-[-0.1px] font-normal" numberOfLines={1}>
              {locationText}
            </Text>
          </View>

          <View className="flex-row items-center gap-1.25">
            <MaterialIcons
              name="category"
              size={13}
              color={APPLE_THEME.textMuted}
            />
            <Text className="shrink text-[#54647A] text-[13px] tracking-[-0.1px] font-normal" numberOfLines={1}>
              {category}
            </Text>
            <View className="w-[3px] h-[3px] rounded-full bg-black/18 mx-1" />
            <Text className="shrink text-[#54647A] text-[13px] tracking-[-0.1px] font-normal" numberOfLines={1}>
              {reviewLabel}
            </Text>
          </View>

          {priceLabel ? (
            <View className="self-start flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-[#E7F0FF]">
              <MaterialIcons name="payments" size={12} color="#1D4ED8" />
              <Text className="text-[#1D4ED8] text-xs font-semibold tracking-[-0.1px]">{priceLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {collectionName || note ? (
        <View className="gap-1.5">
          {collectionName ? (
            <View className="flex-row items-start gap-2 px-3 py-2.5 rounded-[14px] bg-[#F9F9FB]">
              <View className="w-5.5 h-5.5 rounded-full items-center justify-center bg-white">
                <MaterialIcons
                  name="collections-bookmark"
                  size={14}
                  color={APPLE_THEME.text}
                />
              </View>
              <Text className="flex-1 text-[#1D1D1F] text-[13px] leading-[18px] tracking-[-0.1px] font-normal" numberOfLines={1}>
                {collectionName}
              </Text>
            </View>
          ) : null}

          {note ? (
            <View className="flex-row items-start gap-2 px-3 py-2.5 rounded-[14px] bg-[#F9F9FB]">
              <View className="w-5.5 h-5.5 rounded-full items-center justify-center bg-white">
                <MaterialIcons
                  name="sticky-note-2"
                  size={14}
                  color={APPLE_THEME.text}
                />
              </View>
              <Text className="flex-1 text-[#1D1D1F] text-[13px] leading-[18px] tracking-[-0.1px] font-normal" numberOfLines={2}>
                {note}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View className="flex-row gap-2 justify-end border-t border-black/[0.06] pt-2.5">
        <Pressable
          onPress={(event) => {
            event?.stopPropagation?.();
            onOpenNote?.(entry);
          }}
          className="flex-row items-center gap-1.5 px-3 py-[7px] rounded-xl bg-black/[0.04] active:bg-black/[0.08]"
        >
          <MaterialIcons name="edit-note" size={15} color={APPLE_THEME.text} />
          <Text className="text-[#1D1D1F] text-[13px] font-semibold tracking-[-0.1px]">
            {note ? "Sửa ghi chú" : "Thêm ghi chú"}
          </Text>
        </Pressable>

        <Pressable
          disabled={unsaveDisabled}
          onPress={(event) => {
            event?.stopPropagation?.();
            onUnsave?.(place?.id);
          }}
          className={`flex-row items-center gap-1.5 px-3 py-[7px] rounded-xl bg-[#FF3B30]/[0.08] active:bg-[#FF3B30]/[0.14] ${
            unsaveDisabled ? "opacity-45" : ""
          }`}
        >
          <MaterialIcons name="bookmark-remove" size={15} color="#FF3B30" />
          <Text className="text-[#FF3B30] text-[13px] font-semibold tracking-[-0.1px]">Bỏ lưu</Text>
        </Pressable>
      </View>
    </TouchableOpacity>
  );
});
