import React, { memo, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Star, MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { resolvePlaceImageUri, getCategoryIcon } from "../../lib/media-url";
import { TOKENS, CATEGORY_COLORS } from "../../constants/design-tokens";

const formatCompactPrice = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  if (parsed >= 1_000_000) {
    return `${(parsed / 1_000_000).toFixed(1).replace(/\.0$/, "")}`;
  }
  if (parsed >= 1000) {
    return `${Math.round(parsed / 1000)}k`;
  }
  return `${parsed}đ`;
};

function HorizontalPlaceCardInner({ place, onPressDetail }) {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);

  const PRICE_RANGE_LABELS = {
    FREE: t("place.priceRange.free"),
    BUDGET: t("place.priceRange.budget"),
    MODERATE: t("place.priceRange.moderate"),
    EXPENSIVE: t("place.priceRange.expensive"),
    LUXURY: t("place.priceRange.luxury"),
  };

  const handleImageError = useCallback(() => setImgError(true), []);

  if (!place) return null;

  const rawImg = resolvePlaceImageUri(place);
  const previewImg = imgError ? null : rawImg;
  const rating = Number(place?.ratingAvg ?? place?.averageRating ?? 0);

  const categoryName = place?.categoryName || place?.category?.name || "";
  const categorySlug = place?.category?.slug || "";
  const categoryColor = CATEGORY_COLORS[categorySlug] || CATEGORY_COLORS.default;
  const categoryIcon = getCategoryIcon(categoryName);

  const getPreviewPriceLabel = (p) => {
    const compactFrom = formatCompactPrice(p?.priceFrom ?? p?.price_from);
    if (compactFrom) return `${t("place.priceFrom")} ${compactFrom}${t("place.priceRange.free") === "Miễn phí" ? "tr" : "M"}`;
    const priceRangeKey = String(p?.priceRange || "").toUpperCase();
    return PRICE_RANGE_LABELS[priceRangeKey] || t("booking.contactForPrice");
  };

  const priceLabel = getPreviewPriceLabel(place);
  const locationLabel =
    place?.address ||
    [place?.ward?.name, place?.district?.name].filter(Boolean).join(", ") ||
    t("place.defaultLocation");

  const shortAddress = locationLabel.length > 28
    ? locationLabel.substring(0, 26) + "..."
    : locationLabel;

  return (
    <Pressable
      onPress={() => onPressDetail && onPressDetail(place.id)}
      className="bg-white rounded-2xl overflow-hidden border border-zinc-100 shadow-sm mr-3"
      style={styles.card}
    >
      {/* Image Container */}
      <View className="relative w-full h-32 bg-zinc-100">
        {previewImg ? (
          <Image
            source={{ uri: previewImg }}
            style={StyleSheet.absoluteFillObject}
            transition={200}
            contentFit="cover"
            onError={handleImageError}
          />
        ) : (
          <View
            className="flex-1 items-center justify-center"
            style={{ backgroundColor: `${categoryColor}16` }}
          >
            <MaterialIconsRounded
              name={categoryIcon.icon}
              size={32}
              color={categoryColor}
            />
          </View>
        )}
        {/* Category Tag */}
        <View className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-full">
          <Text className="text-[10px] text-white font-medium">
            {place.categoryName || place.category?.name || t("place.defaultPlace")}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="p-3 justify-between flex-1">
        <View>
          <Text className="text-zinc-900 text-sm font-semibold tracking-tight mb-1" numberOfLines={1}>
            {place.name}
          </Text>

          <View className="flex-row items-center gap-1 mb-2">
            <MapPin size={11} color="#71717a" />
            <Text className="text-zinc-500 text-[11px]" numberOfLines={1}>
              {shortAddress}
            </Text>
          </View>
        </View>

        {/* Footer: Price & Rating */}
        <View className="flex-row items-center justify-between mt-1 pt-2 border-t border-zinc-50">
          <Text className="text-zinc-900 text-xs font-semibold">
            {priceLabel}
          </Text>
          
          <View className="flex-row items-center gap-0.5">
            <Star size={12} color="#f59e0b" fill="#f59e0b" />
            <Text className="text-zinc-800 text-xs font-semibold">
              {rating > 0 ? rating.toFixed(1) : "—"}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const HorizontalPlaceCard = memo(HorizontalPlaceCardInner);

const styles = StyleSheet.create({
  card: {
    width: 256,
    height: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  }
});
