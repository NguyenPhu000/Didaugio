import { memo, useState } from "react";
import { View, Text, Pressable, Platform, ActivityIndicator, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { cn } from "../../lib/cn";
import { resolvePlaceImageUri, getCategoryIcon } from "../../lib/media-url";
import { TOKENS, CATEGORY_COLORS } from "../../constants/design-tokens";
import {
  getPlaceRatingValue,
  getPlaceReviewCount,
} from "../../modules/place/utils/placeDisplay";

const RIBBON_DEFAULT = ["#14B8A6", "#22D3EE"]; // Teal → Cyan
const RIBBON_SELECTED = ["#0F766E", "#0F766E"];

function PlacePreviewCardInner({
  place,
  onClose,
  onViewDetail,
  onToggleSelection,
  onAddToTrip,
  onStartRoute,
  travelEtaLabel,
  travelDistanceLabel,
  travelLoading = false,
  compact = false,
  selected = false,
  detailLabel,
  selectedLabel,
  unselectedLabel,
  addToTripLabel,
  routeActionLabel,
  showCloseButton = true,
  showDetailAction = true,
  showSelectionAction = false,
  showAddToTripAction = false,
  showRouteAction = false,
}) {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);

  // Price & Review helpers
  const PRICE_RANGE_LABELS = {
    FREE: t("place.priceRange.free"),
    BUDGET: t("place.priceRange.budget"),
    MODERATE: t("place.priceRange.moderate"),
    EXPENSIVE: t("place.priceRange.expensive"),
    LUXURY: t("place.priceRange.luxury"),
  };

  const formatReviewCount = (count) => {
    const parsed = Number(count || 0);
    if (!parsed) return null;
    if (parsed >= 1000) return `${(parsed / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    return parsed;
  };

  const formatCompactPrice = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    if (parsed >= 1_000_000) return `${(parsed / 1_000_000).toFixed(1)}tr`;
    if (parsed >= 1000) return `${Math.round(parsed / 1000)}k`;
    return `${parsed}đ`;
  };

  const getPreviewPriceLabel = (p) => {
     const compactFrom = formatCompactPrice(p?.priceFrom ?? p?.price_from);
    if (compactFrom) return `${t("place.priceFrom")} ${compactFrom}`;
    const key = String(p?.priceRange || "").toUpperCase();
    return PRICE_RANGE_LABELS[key] || t("booking.contactForPrice");
  };

  if (!place) return null;

  const rawImg = resolvePlaceImageUri(place);
  const rating = getPlaceRatingValue(place);
  const reviewCount = getPlaceReviewCount(place);
  const reviewLabel = formatReviewCount(reviewCount);
  const isNewPlace = !reviewLabel;

  const priceLabel = getPreviewPriceLabel(place);
  const locationLabel =
    place?.address ||
    [place?.ward?.name, place?.district?.name].filter(Boolean).join(", ") ||
    t("place.defaultLocation");

  const categorySlug = place?.category?.slug || "";
  const categoryName = place?.category?.name || "";
  const categoryColor = CATEGORY_COLORS[categorySlug] || CATEGORY_COLORS.default;
  const categoryIcon = getCategoryIcon(categoryName);

  const ribbonColors = selected ? RIBBON_SELECTED : RIBBON_DEFAULT;
  const imageSize = compact ? 82 : 104;

  const hasTravelInfo = Boolean(travelEtaLabel || travelDistanceLabel);
  const travelLabel = travelLoading
    ? t("place.calculating")
    : [travelEtaLabel, travelDistanceLabel].filter(Boolean).join(" · ");

  const resolvedDetailLabel = detailLabel || t("place.viewDetail");

  return (
    <View
      className="rounded-3xl overflow-hidden bg-white"
      style={[TOKENS.shadow.lg, { borderCurve: "continuous" }]}
    >
      {/* Accent Ribbon */}
      <View style={{ flexDirection: "row", height: 4 }}>
        <View style={{ flex: 1, backgroundColor: ribbonColors[0] }} />
        <View style={{ flex: 1, backgroundColor: ribbonColors[1] }} />
      </View>

      <View className="relative">
        {/* Glass Background */}
        {Platform.OS !== "web" && (
          <BlurView
            intensity={Platform.OS === "ios" ? 88 : 95}
            tint="light"
            style={StyleSheet.absoluteFillObject}
          />
        )}

        <View className={cn("flex-row p-4", compact && "p-3.5")}>
          {/* Image Container */}
          <View
            style={{ width: imageSize, height: imageSize }}
            className={cn(
              "rounded-2xl overflow-hidden bg-slate-100 shadow-sm relative",
              compact && "rounded-xl"
            )}
          >
            {rawImg && !imgError ? (
              <Image
                source={{ uri: rawImg }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={250}
                onError={() => setImgError(true)}
              />
            ) : (
              <View
                className="flex-1 items-center justify-center"
                style={{ backgroundColor: `${categoryColor}15` }}
              >
                <MaterialIconsRounded
                  name={categoryIcon.icon}
                  size={32}
                  color={categoryColor}
                />
              </View>
            )}

            {/* Category Icon Badge */}
            {categoryName && (
              <View
                className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/95 items-center justify-center border border-white shadow-sm"
              >
                <MaterialIconsRounded name={categoryIcon.icon} size={14} color={categoryColor} />
              </View>
            )}

            {/* Rating Badge */}
            {rating > 0 && (
              <View className="absolute bottom-2 left-2 flex-row items-center bg-black/70 px-2 py-0.5 rounded-full">
                <MaterialIconsRounded name="star" size={12} color="#FACC15" />
                <Text className="text-white text-[12px] font-bold ml-0.5">{rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View className="flex-1 ml-4 min-w-0">
            <View className="flex-row items-start justify-between">
              <Text
                numberOfLines={2}
                className={cn(
                  "flex-1 text-[17px] leading-tight font-semibold text-slate-900",
                  compact && "text-[15.5px]"
                )}
                style={{ fontFamily: TOKENS.font.heading }}
              >
                {place.name}
              </Text>

              {showCloseButton && (
                <Pressable
                  onPress={onClose}
                  hitSlop={12}
                  className="ml-2 -mt-1 w-8 h-8 rounded-full items-center justify-center active:bg-slate-100"
                >
                  <MaterialIconsRounded name="close" size={18} color="#64748B" />
                </Pressable>
              )}
            </View>

            {/* Meta */}
            <View className="flex-row items-center gap-2 mt-1.5">
              {isNewPlace ? (
                <View className="px-3 py-1 rounded-full bg-emerald-100">
                  <Text className="text-emerald-700 text-[10px] font-bold tracking-wide">MỚI</Text>
                </View>
              ) : reviewLabel ? (
                <Text className="text-slate-500 text-sm font-medium">
                  {reviewLabel} đánh giá
                </Text>
              ) : null}

              {priceLabel && (
                <>
                  <Text className="text-slate-300">·</Text>
                  <Text className="text-slate-600 font-semibold text-sm">{priceLabel}</Text>
                </>
              )}
            </View>

            {/* Location */}
            <View className="flex-row items-center gap-1.5 mt-2">
              <MaterialIconsRounded name="place" size={15} color="#94A3B8" />
              <Text numberOfLines={1} className="text-slate-500 text-[13.5px] flex-1">
                {locationLabel}
              </Text>
            </View>

            {/* Travel Info */}
            {(hasTravelInfo || travelLoading) && (
              <View className="mt-3 self-start px-3 py-1 rounded-2xl bg-teal-50 border border-teal-100 flex-row items-center gap-1.5">
                {travelLoading ? (
                  <ActivityIndicator size="small" color="#14B8A6" />
                ) : (
                  <MaterialIconsRounded name="near-me" size={14} color="#14B8A6" />
                )}
                <Text className="text-teal-700 font-semibold text-xs">{travelLabel}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row gap-2.5 mt-4">
              {showRouteAction && onStartRoute && (
                <Pressable
                  onPress={() => onStartRoute(place)}
                  className="flex-1 h-10 bg-teal-600 rounded-2xl items-center justify-center active:opacity-90"
                >
                  <MaterialIconsRounded name="navigation" size={18} color="white" />
                </Pressable>
              )}

              {showSelectionAction && onToggleSelection && (
                <Pressable
                  onPress={() => onToggleSelection(place)}
                  className={cn(
                    "h-10 px-5 rounded-2xl items-center justify-center border",
                    selected
                      ? "bg-teal-600 border-teal-600"
                      : "bg-white border-slate-200"
                  )}
                >
                  <MaterialIconsRounded
                    name={selected ? "check" : "add"}
                    size={18}
                    color={selected ? "white" : "#475569"}
                  />
                </Pressable>
              )}

              {showAddToTripAction && onAddToTrip && (
                <Pressable
                  onPress={() => onAddToTrip(place)}
                  className="h-10 px-5 rounded-2xl border border-slate-200 bg-white items-center justify-center active:bg-slate-50"
                >
                  <MaterialIconsRounded name="playlist-add" size={18} color="#475569" />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Main CTA */}
        {showDetailAction && onViewDetail && (
          <Pressable
            onPress={() => onViewDetail(place)}
            className="h-12 bg-slate-900 flex-row items-center justify-center gap-2 active:bg-black"
          >
            <Text className="text-white font-semibold text-[15px] tracking-wide">
              {resolvedDetailLabel}
            </Text>
            <MaterialIconsRounded name="arrow-forward" size={17} color="white" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export const PlacePreviewCard = memo(PlacePreviewCardInner);
