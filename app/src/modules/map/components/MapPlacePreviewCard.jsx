import { memo, useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { CATEGORY_COLORS, TOKENS } from "@/constants/design-tokens";
import { getCategoryIcon, resolvePlaceImageUri } from "@/lib/media-url";
import {
  getPlaceRatingValue,
  getPlaceReviewCount,
} from "@/modules/place/utils/placeDisplay";

const formatReviewCount = (count, t) => {
  const parsed = Number(count || 0);
  if (!parsed) return t("place.newBadge");
  if (parsed >= 1000) {
    return `${(parsed / 1000).toFixed(1).replace(/\.0$/, "")}k ${t("exploreHelpers.reviews")}`;
  }
  return `${parsed} ${t("exploreHelpers.reviews")}`;
};

const MapPlacePreviewCard = memo(function MapPlacePreviewCard({
  place,
  onClose,
  onViewDetail,
  onStartRoute,
  travelEtaLabel,
  travelDistanceLabel,
  travelLoading = false,
  compact = false,
}) {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const handleImageError = useCallback(() => setImgError(true), []);

  const handleViewDetail = useCallback(() => {
    onViewDetail?.(place);
  }, [onViewDetail, place]);

  const handleStartRoute = useCallback(() => {
    onStartRoute?.(place);
  }, [onStartRoute, place]);

  if (!place) return null;

  const imageUri = imgError ? null : resolvePlaceImageUri(place);
  const rating = getPlaceRatingValue(place);
  const reviewCount = getPlaceReviewCount(place);
  const categoryName = place?.category?.name || "";
  const categorySlug = place?.category?.slug || "";
  const categoryColor = CATEGORY_COLORS[categorySlug] || CATEGORY_COLORS.default;
  const categoryIcon = getCategoryIcon(categoryName);
  const locationLabel =
    place?.address ||
    [place?.ward?.name, place?.district?.name].filter(Boolean).join(", ") ||
    t("place.defaultLocation");
  const travelLabel = [travelEtaLabel, travelDistanceLabel]
    .filter(Boolean)
    .join(" / ");
  const imageSize = compact ? 74 : 84;
  const metaParts = [];
  if (rating > 0) metaParts.push(rating.toFixed(1));
  metaParts.push(formatReviewCount(reviewCount, t));
  if (categoryName) metaParts.push(categoryName);
  const metaLabel = metaParts.join(" / ");

  return (
    <View
      className="overflow-hidden rounded-[24px] border border-white/70 bg-white/95 p-3 shadow-xl shadow-slate-900/10"
      style={{ borderCurve: "continuous" }}
    >
      <View className="absolute left-0 top-4 h-16 w-1 rounded-r-full bg-cyan-500" />
      <View className="flex-row items-center gap-3">
        <View
          className="overflow-hidden bg-slate-100"
          style={{
            width: imageSize,
            height: imageSize,
            borderRadius: compact ? 16 : 18,
            borderCurve: "continuous",
          }}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={160}
              onError={handleImageError}
            />
          ) : (
            <View
              className="flex-1 items-center justify-center"
              style={{ backgroundColor: `${categoryColor}16` }}
            >
              <MaterialIconsRounded
                name={categoryIcon.icon}
                size={26}
                color={categoryColor}
              />
            </View>
          )}
        </View>

        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-start gap-2">
            <Text
              numberOfLines={2}
              className="flex-1 text-[16px] font-bold leading-[20px] text-slate-950"
            >
              {place?.name || t("place.defaultPlace")}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t("common.close", { defaultValue: "Close" })}
              hitSlop={10}
              className="h-7 w-7 items-center justify-center rounded-full bg-slate-100"
            >
              <MaterialIconsRounded name="close" size={15} color="#475569" />
            </Pressable>
          </View>

          <View className="flex-row items-center gap-1.5">
            {rating > 0 ? (
              <MaterialIconsRounded name="star" size={14} color="#F59E0B" />
            ) : null}
            <Text
              numberOfLines={1}
              className="flex-1 text-[12px] font-semibold text-slate-600"
            >
              {metaLabel}
            </Text>
          </View>

          <View className="flex-row items-center gap-1.5">
            <MaterialIconsRounded name="place" size={14} color="#64748B" />
            <Text
              numberOfLines={1}
              className="flex-1 text-[12px] font-medium text-slate-500"
            >
              {locationLabel}
            </Text>
          </View>

          {travelLoading || travelLabel ? (
            <View className="mt-1 flex-row items-center gap-1.5 self-start rounded-full bg-cyan-50 px-2.5 py-1">
              {travelLoading ? (
                <ActivityIndicator
                  size="small"
                  color={TOKENS.color.primary[500]}
                />
              ) : (
                <MaterialIconsRounded name="near-me" size={13} color="#0EA5E9" />
              )}
              <Text className="text-[11.5px] font-bold text-cyan-700">
                {travelLoading ? t("place.calculating") : travelLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        <Pressable
          onPress={handleViewDetail}
          accessibilityRole="button"
          className="h-10 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-slate-950 active:opacity-90"
        >
          <Text className="text-[13px] font-bold text-white" style={{ fontFamily: TOKENS.font.semibold }}>
            {t("place.viewDetail", { defaultValue: "Xem chi tiết" })}
          </Text>
          <MaterialIconsRounded name="arrow-forward" size={16} color="#FFFFFF" />
        </Pressable>
        <Pressable
          onPress={handleStartRoute}
          accessibilityRole="button"
          className="h-10 w-12 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
        >
          <MaterialIconsRounded name="directions" size={18} color="#0F172A" />
        </Pressable>
      </View>
    </View>
  );
});

export default MapPlacePreviewCard;
