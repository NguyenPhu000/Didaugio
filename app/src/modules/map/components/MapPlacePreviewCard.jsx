import { memo, useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { CATEGORY_COLORS, TOKENS } from "@/constants/design-tokens";
import { resolvePlaceImageUri } from "@/lib/media-url";
import { getCategoryIconName } from "@/constants/categoryIcons";
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

  useEffect(() => {
    setImgError(false);
  }, [place?.id]);

  const handleImageError = useCallback(() => setImgError(true), []);
  const handleViewDetail = useCallback(() => onViewDetail?.(place), [onViewDetail, place]);
  const handleStartRoute = useCallback(() => onStartRoute?.(place), [onStartRoute, place]);

  if (!place) return null;

  const imageUri = imgError ? null : resolvePlaceImageUri(place);
  const rating = getPlaceRatingValue(place);
  const reviewCount = getPlaceReviewCount(place);
  const categoryName = place?.category?.name || "";
  const categorySlug = place?.category?.slug || "";
  const categoryColor = place?.category?.color || CATEGORY_COLORS[categorySlug] || CATEGORY_COLORS.default;
  const categoryIcon = getCategoryIconName(place?.category);
  const locationLabel =
    place?.address ||
    [place?.ward?.name, place?.district?.name].filter(Boolean).join(", ") ||
    t("place.defaultLocation");
  const travelLabel = [travelEtaLabel, travelDistanceLabel].filter(Boolean).join(" · ");
  const imageSize = compact ? 78 : 92;

  return (
    <View
      className="overflow-hidden rounded-[26px] border border-white/80 bg-white"
      style={[TOKENS.shadow.md, { borderCurve: "continuous" }]}
    >
      <View className="flex-row gap-3 p-3">
        <View
          className="overflow-hidden bg-slate-100"
          style={{
            width: imageSize,
            height: imageSize,
            borderRadius: compact ? 18 : 20,
            borderCurve: "continuous",
          }}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={160}
              onError={handleImageError}
            />
          ) : (
            <View
              className="flex-1 items-center justify-center"
              style={{ backgroundColor: `${categoryColor}16` }}
            >
              <MaterialCommunityIcons name={categoryIcon} size={27} color={categoryColor} />
            </View>
          )}
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-start gap-2">
            <View className="min-w-0 flex-1 gap-1">
              {categoryName ? (
                <View className="flex-row items-center gap-1">
                  <MaterialCommunityIcons name={categoryIcon} size={12} color={categoryColor} />
                  <Text
                    numberOfLines={1}
                    className="text-[10px] font-bold uppercase tracking-[0.7px]"
                    style={{ color: categoryColor }}
                  >
                    {categoryName}
                  </Text>
                </View>
              ) : null}
              <Text
                numberOfLines={2}
                className="text-[17px] font-bold leading-[20px] text-slate-950"
                style={{ fontFamily: TOKENS.font.heading }}
              >
                {place?.name || t("place.defaultPlace")}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t("common.close", { defaultValue: "Close" })}
              hitSlop={10}
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
            >
              <MaterialIconsRounded name="close" size={16} color="#475569" />
            </Pressable>
          </View>

          <View className="mt-2 flex-row items-center gap-1.5">
            {rating > 0 ? (
              <>
                <MaterialIconsRounded name="star" size={14} color="#F59E0B" />
                <Text className="text-[12px] font-bold text-slate-800">{rating.toFixed(1)}</Text>
                <Text className="text-[12px] text-slate-400">·</Text>
              </>
            ) : null}
            <Text numberOfLines={1} className="flex-1 text-[12px] font-medium text-slate-500">
              {formatReviewCount(reviewCount, t)}
            </Text>
          </View>

          <View className="mt-1.5 flex-row items-center gap-1.5">
            <MaterialIconsRounded name="place" size={14} color="#94A3B8" />
            <Text numberOfLines={1} className="flex-1 text-[12px] font-medium text-slate-500">
              {locationLabel}
            </Text>
          </View>

          {travelLoading || travelLabel ? (
            <View className="mt-2 flex-row items-center gap-1.5 self-start rounded-full bg-sky-50 px-2.5 py-1">
              {travelLoading ? (
                <ActivityIndicator size="small" color={TOKENS.color.primary[500]} />
              ) : (
                <MaterialIconsRounded name="near-me" size={13} color="#0284C7" />
              )}
              <Text className="text-[11px] font-bold text-sky-700">
                {travelLoading ? t("place.calculating") : travelLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className="flex-row items-center gap-2 border-t border-slate-100 px-3 pb-3 pt-2.5">
        <Pressable
          onPress={handleViewDetail}
          accessibilityRole="button"
          className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-[15px] bg-slate-950 active:opacity-90"
          style={{ borderCurve: "continuous" }}
        >
          <Text className="text-[13px] font-bold text-white" style={{ fontFamily: TOKENS.font.semibold }}>
            {t("place.viewDetail", { defaultValue: "Xem chi tiết" })}
          </Text>
          <MaterialIconsRounded name="arrow-forward" size={16} color="#FFFFFF" />
        </Pressable>
        <Pressable
          onPress={handleStartRoute}
          accessibilityRole="button"
          accessibilityLabel={t("place.directions")}
          className="h-11 w-11 items-center justify-center rounded-[15px] bg-slate-100 active:bg-slate-200"
          style={{ borderCurve: "continuous" }}
        >
          <MaterialIconsRounded name="directions" size={19} color="#0F172A" />
        </Pressable>
      </View>
    </View>
  );
});

export default MapPlacePreviewCard;
