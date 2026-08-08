import React, { memo, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Star, MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import {
  getCategoryIcon,
  getOptimizedCloudinaryUrl,
  PLACE_IMAGE_BLURHASH,
  resolvePlaceImageUri,
} from "../../lib/media-url";
import { CATEGORY_COLORS, TOKENS } from "../../constants/design-tokens";

function formatPlacePrice(place, t) {
  const from = place?.priceFrom ?? place?.price_from;

  if (typeof from === "number" && from > 0) {
    if (from >= 1_000_000) {
      const formatted = (from / 1_000_000).toFixed(1).replace(/\.0$/, "");
      return `Từ ${formatted} triệu`;
    }
    if (from >= 1000) {
      return `Từ ${Math.round(from / 1000)}k`;
    }
    return `Từ ${from}đ`;
  }

  const priceRange = String(place?.priceRange || place?.price_range || "").toUpperCase();
  if (priceRange === "FREE" || from === 0) return t("place.priceRange.free") || "Miễn phí";
  if (priceRange === "BUDGET") return "Bình dân";
  if (priceRange === "MODERATE") return "Vừa phải";
  if (priceRange === "EXPENSIVE") return "Cao cấp";

  return t("booking.contactForPrice") || "Liên hệ giá";
}

function HorizontalPlaceCardInner({ place, onPressDetail }) {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);

  const handleImageError = useCallback(() => setImgError(true), []);

  if (!place) return null;

  const rawImg = getOptimizedCloudinaryUrl(resolvePlaceImageUri(place), 400);
  const previewImg = imgError ? null : rawImg;
  const rating = Number(place?.ratingAvg ?? place?.averageRating ?? 0);

  const categoryName = place?.categoryName || place?.category?.name || "";
  const categorySlug = place?.category?.slug || "";
  const categoryColor = CATEGORY_COLORS[categorySlug] || CATEGORY_COLORS.default;
  const categoryIcon = getCategoryIcon(categoryName);

  const priceLabel = formatPlacePrice(place, t);
  const locationLabel =
    place?.address ||
    [place?.ward?.name, place?.district?.name].filter(Boolean).join(", ") ||
    t("place.defaultLocation") ||
    "Cần Thơ";

  return (
    <Pressable
      onPress={() => onPressDetail && onPressDetail(place.id)}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={place.name}
    >
      {/* Image Container */}
      <View style={styles.imageWrap}>
        {previewImg ? (
          <Image
            source={{ uri: previewImg }}
            style={StyleSheet.absoluteFillObject}
            transition={200}
            contentFit="cover"
            placeholder={{ blurhash: PLACE_IMAGE_BLURHASH }}
            placeholderContentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={`hpc-${place.id}`}
            onError={handleImageError}
          />
        ) : (
          <View
            style={[
              styles.fallbackImageWrap,
              { backgroundColor: `${categoryColor}18` },
            ]}
          >
            <MaterialIconsRounded
              name={categoryIcon.icon}
              size={32}
              color={categoryColor}
            />
          </View>
        )}
        
        {/* Category Tag */}
        {categoryName ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText} numberOfLines={1}>
              {categoryName}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Content */}
      <View style={styles.contentWrap}>
        <Text style={styles.placeName} numberOfLines={1} ellipsizeMode="tail">
          {place.name}
        </Text>

        <View style={styles.locationRow}>
          <MapPin size={11} color={TOKENS.color.semantic.slate[500]} />
          <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
            {locationLabel}
          </Text>
        </View>

        {/* Footer: Price & Rating */}
        <View style={styles.footerRow}>
          <Text style={styles.priceText} numberOfLines={1}>
            {priceLabel}
          </Text>
          
          <View style={styles.ratingRow}>
            {rating > 0 ? (
              <>
                <Star
                  size={12}
                  color={TOKENS.color.semantic.star}
                  fill={TOKENS.color.semantic.star}
                />
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              </>
            ) : (
              <Text style={styles.ratingText}>{t("place.detail.new")}</Text>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export const HorizontalPlaceCard = memo(HorizontalPlaceCardInner);

const styles = StyleSheet.create({
  card: {
    width: 236,
    height: 205,
    borderRadius: 20,
    backgroundColor: TOKENS.color.surface.light,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: TOKENS.color.semantic.slate[200],
    boxShadow: "0 6px 20px rgba(15, 23, 42, 0.07)",
    marginRight: 12,
  },
  imageWrap: {
    width: "100%",
    height: 120,
    backgroundColor: TOKENS.color.semantic.slate[100],
    position: "relative",
  },
  fallbackImageWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    maxWidth: 160,
  },
  categoryBadgeText: {
    color: TOKENS.color.surface.light,
    fontSize: 10,
    fontFamily: TOKENS.font.medium,
  },
  contentWrap: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  placeName: {
    color: TOKENS.color.semantic.slate[900],
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    lineHeight: 19,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    flex: 1,
    color: TOKENS.color.semantic.slate[500],
    fontSize: 11.5,
    fontFamily: TOKENS.font.body,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: TOKENS.color.semantic.slate[100],
    marginTop: 4,
  },
  priceText: {
    color: TOKENS.color.primary[600],
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    fontVariant: ["tabular-nums"],
    flex: 1,
    marginRight: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: TOKENS.color.semantic.starSurface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ratingText: {
    color: TOKENS.color.semantic.starText,
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    fontVariant: ["tabular-nums"],
  },
});
