import {
  Pressable,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "../../lib/cn";
import { TOKENS, CATEGORY_COLORS } from "../../constants/design-tokens";
import { QUERY_KEYS } from "../../constants/query-keys";
import { resolvePlaceImageUri } from "../../lib/media-url";

const CARD_SHADOW = TOKENS.shadow.md;
const CARD_RADIUS = 28;
const IMAGE_OVERLAY_COLOR = "rgba(2,6,23,0.34)";
const CARD_BORDER = "rgba(217,232,247,0.95)";
const IMAGE_HEIGHT_DEFAULT = 204;
const IMAGE_HEIGHT_COMPACT = 178;
const ARROW_BUTTON_STYLE = {
  position: "absolute",
  right: 12,
  bottom: 12,
  width: 34,
  height: 34,
  borderRadius: 17,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(255,255,255,0.95)",
  borderWidth: 1,
  borderColor: "#BFDBFE",
  shadowColor: TOKENS.color.primary[600],
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.16,
  shadowRadius: 10,
  elevation: 4,
};

function getImageSource(place) {
  return resolvePlaceImageUri(place);
}

function getCategorySlug(place) {
  return place?.category?.slug ?? place?.categorySlug ?? "default";
}

function getReviewCount(place) {
  const parsed = Number(place?.reviewCount ?? place?._count?.reviews ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatReviewLabel(reviewCount) {
  if (!reviewCount) return "Mới";
  if (reviewCount >= 1000) {
    return `${(reviewCount / 1000).toFixed(1).replace(/\.0$/, "")}k đánh giá`;
  }
  return `${reviewCount} đánh giá`;
}

function formatCompactPrice(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  if (parsed >= 1_000_000) {
    return `${(parsed / 1_000_000).toFixed(1).replace(/\.0$/, "")}tr`;
  }
  if (parsed >= 1000) {
    return `${Math.round(parsed / 1000)}k`;
  }
  return String(parsed);
}

function getPriceLabel(place) {
  const compact = formatCompactPrice(place?.priceFrom ?? place?.price_from);
  return compact ? `Từ ${compact}đ` : null;
}

export function PlaceCard({ place, onSave, isSaved, style }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();

  const compact = width <= 360;
  const imageHeight = compact ? IMAGE_HEIGHT_COMPACT : IMAGE_HEIGHT_DEFAULT;

  const thumbnailUri = getImageSource(place);
  const ratingValue = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  const hasRating = Number.isFinite(ratingValue) && ratingValue > 0;
  const category = place?.category?.name ?? place?.categoryName ?? "";
  const categorySlug = getCategorySlug(place);
  const placeholderColor =
    CATEGORY_COLORS[categorySlug] ?? CATEGORY_COLORS.default;
  const locationText =
    place?.address ??
    [place?.ward?.name, place?.district?.name].filter(Boolean).join(", ") ??
    "Cần Thơ";
  const reviewCount = getReviewCount(place);
  const reviewLabel = formatReviewLabel(reviewCount);
  const priceLabel = getPriceLabel(place);
  const viewCount = Number(place?.viewCount ?? 0);

  const handlePressIn = () => {
    if (!place?.id) return;
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.places.detail(place.id),
      staleTime: 1000 * 60 * 5,
    });
  };

  return (
    <Pressable
      onPress={() => router.push(`/place/${place.id}`)}
      onPressIn={handlePressIn}
      className={cn("bg-white overflow-hidden mb-4")}
      style={({ pressed }) => [
        CARD_SHADOW,
        {
          borderRadius: CARD_RADIUS,
          borderWidth: 1,
          borderColor: CARD_BORDER,
        },
        pressed && { transform: [{ scale: 0.985 }], opacity: 0.96 },
        style,
      ]}
    >
      <View style={[styles.imageWrap, { height: imageHeight }]}>
        {thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            placeholder={{ color: `${placeholderColor}22` }}
            contentFit="cover"
            transition={220}
            cachePolicy="memory-disk"
            style={styles.image}
          />
        ) : (
          <View
            style={{
              ...styles.imageFallback,
              height: imageHeight,
              backgroundColor: `${placeholderColor}22`,
            }}
          >
            <MaterialIcons name="place" size={36} color={placeholderColor} />
          </View>
        )}

        <View
          className="absolute left-0 right-0 top-0 bottom-0"
          style={{ backgroundColor: IMAGE_OVERLAY_COLOR }}
        />

        {onSave ? (
          <Pressable
            onPress={() => onSave(place.id)}
            hitSlop={12}
            className="absolute top-3 right-3 w-10 h-10 rounded-full items-center justify-center border border-white/60"
            style={{ backgroundColor: "rgba(255,255,255,0.24)" }}
          >
            <MaterialIcons
              name={isSaved ? "bookmark" : "bookmark-border"}
              size={22}
              color="#fff"
            />
          </Pressable>
        ) : null}

        {category ? (
          <View style={styles.categoryBadge}>
            <Text numberOfLines={1} style={styles.categoryBadgeText}>
              {category}
            </Text>
          </View>
        ) : null}
        <View style={ARROW_BUTTON_STYLE}>
          <MaterialIcons
            name="arrow-forward"
            size={18}
            color={TOKENS.color.primary[600]}
          />
        </View>
      </View>

      <View style={[styles.body, compact && styles.bodyCompact]}>
        <Text
          style={[styles.title, compact && styles.titleCompact]}
          numberOfLines={1}
        >
          {place?.name}
        </Text>

        <View style={styles.locationRow}>
          <MaterialIcons
            name="place"
            size={compact ? 12 : 13}
            color={TOKENS.color.primary[600]}
          />
          <Text
            numberOfLines={1}
            style={[styles.locationText, compact && styles.locationTextCompact]}
          >
            {locationText}
          </Text>
        </View>

        <View style={[styles.metaRow, compact && styles.metaRowCompact]}>
          {hasRating ? (
            <View
              style={[styles.ratingPill, compact && styles.ratingPillCompact]}
            >
              <MaterialIcons
                name="star"
                size={compact ? 12 : 13}
                color="#F59E0B"
              />
              <Text
                style={[styles.ratingText, compact && styles.ratingTextCompact]}
              >
                {ratingValue.toFixed(1)}
              </Text>
            </View>
          ) : null}

          <Text
            numberOfLines={1}
            style={[styles.reviewText, compact && styles.reviewTextCompact]}
          >
            {reviewLabel}
          </Text>

          {priceLabel ? (
            <View
              style={[styles.pricePill, compact && styles.pricePillCompact]}
            >
              <MaterialIcons
                name="payments"
                size={compact ? 11 : 12}
                color={TOKENS.color.primary[600]}
              />
              <Text
                style={[styles.priceText, compact && styles.priceTextCompact]}
              >
                {priceLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {viewCount > 0 ? (
          <View style={styles.viewsRow}>
            <MaterialIcons
              name="visibility"
              size={compact ? 12 : 13}
              color={TOKENS.color.neutral[400]}
            />
            <Text
              style={[styles.viewsText, compact && styles.viewsTextCompact]}
            >
              {viewCount.toLocaleString()} lượt xem
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBadge: {
    position: "absolute",
    left: 12,
    right: 54,
    bottom: 12,
    height: 26,
    borderRadius: 999,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  categoryBadgeText: {
    color: "#F8FAFC",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.2,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 14,
    gap: 8,
  },
  bodyCompact: {
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 12,
    gap: 6,
  },
  title: {
    color: "#0F172A",
    fontSize: 17,
    lineHeight: 22,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.2,
  },
  titleCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    flex: 1,
    color: "#475569",
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
  },
  locationTextCompact: {
    fontSize: 11,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  metaRowCompact: {
    gap: 6,
    paddingTop: 6,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFF7E6",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 999,
    paddingHorizontal: 8,
    height: 24,
  },
  ratingPillCompact: {
    height: 22,
    paddingHorizontal: 7,
  },
  ratingText: {
    color: "#92400E",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  ratingTextCompact: {
    fontSize: 10,
  },
  reviewText: {
    flex: 1,
    color: "#64748B",
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
  },
  reviewTextCompact: {
    fontSize: 10,
  },
  pricePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 999,
    paddingHorizontal: 8,
    height: 24,
    maxWidth: 114,
  },
  pricePillCompact: {
    height: 22,
    maxWidth: 100,
    paddingHorizontal: 7,
  },
  priceText: {
    color: "#1D4ED8",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  priceTextCompact: {
    fontSize: 10,
  },
  viewsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewsText: {
    color: "#94A3B8",
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
  },
  viewsTextCompact: {
    fontSize: 10,
  },
});
