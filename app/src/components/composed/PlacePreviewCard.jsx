import { memo, useState, useCallback } from "react";
import { View, Text, Pressable, Platform, ActivityIndicator, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { cn } from "../../lib/cn";
import { resolvePlaceImageUri, getCategoryIcon } from "../../lib/media-url";
import { TOKENS, CATEGORY_COLORS } from "../../constants/design-tokens";

export const getPlaceRatingValue = (place) => {
  const parsed = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getPlaceReviewCount = (place) => {
  const parsed = Number(place?.reviewCount ?? place?._count?.reviews ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

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
    const handleImageError = useCallback(() => setImgError(true), []);

    const PRICE_RANGE_LABELS = {
      FREE: t("place.priceRange.free"),
      BUDGET: t("place.priceRange.budget"),
      MODERATE: t("place.priceRange.moderate"),
      EXPENSIVE: t("place.priceRange.expensive"),
      LUXURY: t("place.priceRange.luxury"),
    };

    const formatReviewCount = (count) => {
      const parsed = Number(count || 0);
      if (!parsed) return t("place.newBadge");
      if (parsed >= 1000) {
        return `${(parsed / 1000).toFixed(1).replace(/\.0$/, "")}k ${t("exploreHelpers.reviews")}`;
      }
      return `${parsed} ${t("exploreHelpers.reviews")}`;
    };

    const formatCompactPrice = (value) => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed <= 0) return null;
      if (parsed >= 1_000_000) {
        return `${(parsed / 1_000_000).toFixed(1).replace(/\.0$/, "")} ${t("place.million")}`;
      }
      if (parsed >= 1000) {
        return `${Math.round(parsed / 1000)}k`;
      }
      return `${parsed}đ`;
    };

    const getPreviewPriceLabel = (p) => {
      const compactFrom = formatCompactPrice(p?.priceFrom ?? p?.price_from);
      if (compactFrom) return `${t("place.priceFrom")} ${compactFrom}`;
      const priceRangeKey = String(p?.priceRange || "").toUpperCase();
      return PRICE_RANGE_LABELS[priceRangeKey] || t("booking.contactForPrice");
    };

    const resolvedDetailLabel = detailLabel || t("place.viewDetail");
    const resolvedSelectedLabel = selectedLabel || t("place.selectedLabel");
    const resolvedUnselectedLabel = unselectedLabel || t("place.selectLabel");
    const resolvedAddToTripLabel = addToTripLabel || t("place.addLeg");
    const resolvedRouteActionLabel = routeActionLabel || t("place.directionsLabel");

    if (!place) return null;

    const rawImg = resolvePlaceImageUri(place);
    const previewImg = imgError ? null : rawImg;
    const rating = getPlaceRatingValue(place);
    const reviewCount = getPlaceReviewCount(place);
    const locationLabel =
      place?.address ||
      [place?.ward?.name, place?.district?.name].filter(Boolean).join(", ") ||
      t("place.defaultLocation");
    
    const shortLocationLabel = locationLabel.length > 30 
      ? locationLabel.substring(0, 28) + "..." 
      : locationLabel;

    const reviewLabel = formatReviewCount(reviewCount);
    const priceLabel = getPreviewPriceLabel(place);
    
    const canShowDetailAction =
      showDetailAction && typeof onViewDetail === "function";
    const canShowSelectionAction =
      showSelectionAction && typeof onToggleSelection === "function";
    const canShowAddToTripAction =
      showAddToTripAction && typeof onAddToTrip === "function";
    const canShowRouteAction =
      showRouteAction && typeof onStartRoute === "function";
      
    const selectionLabel = selected ? resolvedSelectedLabel : resolvedUnselectedLabel;
    const hasTravelInfo = Boolean(travelEtaLabel || travelDistanceLabel);
    
    const travelLabel = travelLoading
      ? t("place.calculating")
      : [travelEtaLabel, travelDistanceLabel].filter(Boolean).join(" · ");

    const categorySlug = place?.category?.slug || "";
    const categoryName = place?.category?.name || "";
    const categoryColor = CATEGORY_COLORS[categorySlug] || CATEGORY_COLORS.default;
    const categoryIcon = getCategoryIcon(categoryName);

    return (
      <View
        className={cn(
          "flex-row items-center p-3 rounded-[24px] overflow-hidden relative border",
          selected ? "bg-blue-50/90 border-blue-200/60" : "bg-white border-slate-100",
          compact && "rounded-2xl p-2.5"
        )}
        style={TOKENS.shadow.sm}
      >
        {/* Native Glassmorphism background for Mobile */}
        {Platform.OS !== "web" && (
          <BlurView
            intensity={Platform.OS === "ios" ? 90 : 96}
            tint="light"
            style={StyleSheet.absoluteFillObject}
          />
        )}

        {/* Left Side: Thumbnail Image */}
        <View
          className={cn(
            "w-[90px] h-[90px] rounded-[18px] overflow-hidden bg-slate-100 relative shadow-sm",
            compact && "w-[76px] h-[76px] rounded-[14px]"
          )}
        >
          {previewImg ? (
            <Image
              source={{ uri: previewImg }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={200}
              onError={handleImageError}
            />
          ) : (
            <View
              className="flex-1 items-center justify-center"
              style={{ backgroundColor: `${categoryColor}16` }}
            >
              <MaterialIconsRounded
                name={categoryIcon.icon}
                size={24}
                color={categoryColor}
              />
            </View>
          )}
        </View>

        {/* Right Side: Place details */}
        <View className="flex-1 min-w-0 ml-3 justify-between">
          {/* Header Row: Title & Close Button */}
          <View className="flex-row items-start justify-between gap-1">
            <Text
              numberOfLines={1}
              className={cn(
                "flex-1 text-base leading-[20px] font-bold text-ink-secondary",
                compact && "text-sm leading-[18px]"
              )}
            >
              {place?.name || t("place.defaultPlace")}
            </Text>
            {showCloseButton ? (
              <Pressable
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                className="w-5 h-5 rounded-full items-center justify-center bg-slate-200/50 active:bg-slate-300/60"
              >
                <MaterialIconsRounded name="close" size={13} color="#475569" />
              </Pressable>
            ) : null}
          </View>

          {/* Secondary Row: Rating, Reviews, Category Badge */}
          <View className="flex-row items-center gap-1.5 flex-wrap mt-0.5">
            {rating > 0 ? (
              <View className="flex-row items-center gap-0.5">
                <MaterialIconsRounded name="star" size={13} color="#FF9F0A" />
                <Text className="text-ink font-semibold text-xs compact:text-[11px]">
                  {rating.toFixed(1)}
                </Text>
              </View>
            ) : null}
            <Text className="text-ink-muted font-medium text-xs compact:text-[10px]">
              ({reviewLabel})
            </Text>
            <Text className="text-slate-300 text-xs compact:text-[10px]">·</Text>
            
            {categoryName ? (
              <View
                style={{ backgroundColor: `${categoryColor}12` }}
                className="px-1.5 py-0.5 rounded-[6px]"
              >
                <Text
                  style={{ color: categoryColor }}
                  className="font-semibold text-[9.5px] compact:text-[8.5px] uppercase tracking-wider"
                >
                  {categoryName}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Location & Travel Status Info */}
          <View className="flex-row items-center gap-1 mt-1 flex-wrap">
            <MaterialIconsRounded name="place" size={12} color="#64748B" />
            <Text
              numberOfLines={1}
              className="text-ink-muted font-medium text-xs compact:text-[10.5px] flex-1"
            >
              {shortLocationLabel}
            </Text>
            
            {priceLabel ? (
              <>
                <Text className="text-slate-300 text-[10px] mx-[1px]">·</Text>
                <Text
                  numberOfLines={1}
                  className="text-ink-secondary font-semibold text-xs compact:text-[10.5px]"
                >
                  {priceLabel}
                </Text>
              </>
            ) : null}
          </View>

          {/* Travel Route Info Banner (if navigating) */}
          {(hasTravelInfo || travelLoading) && (
            <View className="flex-row items-center gap-1 px-2 py-1 rounded-sm mt-1.5 self-start bg-primary-50/90">
              {travelLoading ? (
                <ActivityIndicator size="small" color={TOKENS.color.primary[500]} style={{ marginRight: 2 }} />
              ) : (
                <MaterialIconsRounded name="directions-car" size={13} color={TOKENS.color.primary[500]} />
              )}
              <Text className="text-primary-600 font-semibold text-xs compact:text-[10px] font-bold">
                {travelLabel}
              </Text>
            </View>
          )}

          {/* Bottom Row: CTA Action Buttons */}
          <View className="flex-row items-center gap-2 mt-2">
            {canShowRouteAction ? (
              <Pressable
                onPress={() => onStartRoute(place)}
                style={TOKENS.shadow.accent}
                className="flex-row items-center gap-1 rounded-full px-3.5 h-8 bg-brand active:scale-95 transition-all"
              >
                <MaterialIconsRounded name="navigation" size={13} color="#FFFFFF" />
                <Text className="text-white font-semibold text-xs">
                  {resolvedRouteActionLabel}
                </Text>
              </Pressable>
            ) : null}

            {canShowDetailAction ? (
              <Pressable
                onPress={() => onViewDetail(place)}
                className="flex-row items-center gap-1 rounded-full px-3.5 h-8 bg-ink/5 active:scale-95 transition-all"
              >
                <MaterialIconsRounded name="arrow-forward" size={13} color="#334155" />
                <Text className="font-semibold text-slate-700 text-xs font-bold">
                  {resolvedDetailLabel}
                </Text>
              </Pressable>
            ) : null}

            {canShowSelectionAction ? (
              <Pressable
                onPress={() => onToggleSelection(place)}
                className={cn(
                  "flex-row items-center gap-1 rounded-full px-3.5 h-8 border active:scale-95 transition-all",
                  selected ? "bg-slate-800 border-slate-800" : "bg-slate-50 border-slate-200"
                )}
              >
                <MaterialIconsRounded
                  name={selected ? "check-circle" : "radio-button-unchecked"}
                  size={13}
                  color={selected ? "#FFFFFF" : "#334155"}
                />
                <Text className={cn("font-semibold text-xs font-bold", selected ? "text-white" : "text-slate-700")}>
                  {selectionLabel}
                </Text>
              </Pressable>
            ) : null}

            {canShowAddToTripAction ? (
              <Pressable
                onPress={() => onAddToTrip(place)}
                className="flex-row items-center gap-1 rounded-full px-3.5 h-8 bg-ink/4 border border-ink/8 active:scale-95 transition-all"
              >
                <MaterialIconsRounded
                  name="add"
                  size={14}
                  color="#334155"
                />
                <Text className="font-semibold text-slate-700 text-xs font-bold">
                  {resolvedAddToTripLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
}

export const PlacePreviewCard = memo(PlacePreviewCardInner);
