import {
  Pressable,
  View,
  Text,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
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
      <View className="relative" style={{ height: imageHeight }}>
        {thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            placeholder={{ color: `${placeholderColor}22` }}
            contentFit="cover"
            transition={220}
            cachePolicy="memory-disk"
            className="w-full h-full"
          />
        ) : (
          <View
            className="w-full items-center justify-center"
            style={{ height: imageHeight, backgroundColor: `${placeholderColor}22` }}
          >
            <MaterialIconsRounded name="place" size={36} color={placeholderColor} />
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
            <MaterialIconsRounded
              name={isSaved ? "bookmark" : "bookmark-border"}
              size={22}
              color="#fff"
            />
          </Pressable>
        ) : null}

        {category ? (
          <View className="absolute left-3 right-[54px] bottom-3 h-[26px] rounded-full px-2.5 items-center justify-center bg-ink/72 border border-white/16">
            <Text numberOfLines={1} className="text-slate-50 font-semibold text-[11px] tracking-[0.2px]">
              {category}
            </Text>
          </View>
        ) : null}
        <View
          className="absolute right-3 bottom-3 w-[34px] h-[34px] rounded-[17px] items-center justify-center bg-white/95 border border-blue-200"
          style={{
            shadowColor: TOKENS.color.primary[600],
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.16,
            shadowRadius: 10,
            elevation: 4,
          }}
        >
          <MaterialIconsRounded
            name="arrow-forward"
            size={18}
            color={TOKENS.color.primary[600]}
          />
        </View>
      </View>

      <View className={cn("px-3.5 pt-[13px] pb-3.5 gap-2", compact && "px-3 pt-[11px] pb-3 gap-1.5")}>
        <Text
          className={cn(
            "text-ink font-heading tracking-tight text-[17px] leading-[22px]",
            compact && "text-base leading-5",
          )}
          numberOfLines={1}
        >
          {place?.name}
        </Text>

        <View className="flex-row items-center gap-1">
          <MaterialIconsRounded
            name="place"
            size={compact ? 12 : 13}
            color={TOKENS.color.primary[600]}
          />
          <Text
            numberOfLines={1}
            className={cn(
              "flex-1 text-slate-600 font-medium text-xs",
              compact && "text-[11px]",
            )}
          >
            {locationText}
          </Text>
        </View>

        <View
          className={cn(
            "flex-row items-center gap-2 pt-2 border-t border-slate-200",
            compact && "gap-1.5 pt-1.5",
          )}
        >
          {hasRating ? (
            <View
              className={cn(
                "flex-row items-center gap-[3px] bg-amber-50 border border-amber-300 rounded-full px-2 h-6",
                compact && "h-[22px] px-[7px]",
              )}
            >
              <MaterialIconsRounded
                name="star"
                size={compact ? 12 : 13}
                color="#F59E0B"
              />
              <Text
                className={cn(
                  "text-amber-800 font-semibold text-[11px]",
                  compact && "text-[10px]",
                )}
              >
                {ratingValue.toFixed(1)}
              </Text>
            </View>
          ) : null}

          <Text
            numberOfLines={1}
            className={cn(
              "flex-1 text-slate-500 font-medium text-[11px]",
              compact && "text-[10px]",
            )}
          >
            {reviewLabel}
          </Text>

          {priceLabel ? (
            <View
              className={cn(
                "flex-row items-center gap-[3px] bg-blue-50 border border-blue-200 rounded-full px-2 h-6 max-w-[114px]",
                compact && "h-[22px] max-w-[100px] px-[7px]",
              )}
            >
              <MaterialIconsRounded
                name="payments"
                size={compact ? 11 : 12}
                color={TOKENS.color.primary[600]}
              />
              <Text
                className={cn(
                  "text-blue-700 font-semibold text-[11px]",
                  compact && "text-[10px]",
                )}
              >
                {priceLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {viewCount > 0 ? (
          <View className="flex-row items-center gap-1">
            <MaterialIconsRounded
              name="visibility"
              size={compact ? 12 : 13}
              color={TOKENS.color.neutral[400]}
            />
            <Text
              className={cn(
                "text-slate-400 font-medium text-[11px]",
                compact && "text-[10px]",
              )}
            >
              {viewCount.toLocaleString()} lượt xem
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

