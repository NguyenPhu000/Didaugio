import { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { cn } from "../../lib/cn";
import { resolvePlaceImageUri } from "../../lib/media-url";

const PRICE_RANGE_LABELS = {
  FREE: "Miễn phí",
  BUDGET: "Bình dân",
  MODERATE: "Trung bình",
  EXPENSIVE: "Cao cấp",
  LUXURY: "Sang trọng",
};

export const getPlaceRatingValue = (place) => {
  const parsed = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getPlaceReviewCount = (place) => {
  const parsed = Number(place?.reviewCount ?? place?._count?.reviews ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatReviewCount = (count) => {
  const parsed = Number(count || 0);
  if (!parsed) return "Mới";
  if (parsed >= 1000) {
    return `${(parsed / 1000).toFixed(1).replace(/\.0$/, "")}k đánh giá`;
  }
  return `${parsed} đánh giá`;
};

const formatCompactPrice = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  if (parsed >= 1_000_000) {
    return `${(parsed / 1_000_000).toFixed(1).replace(/\.0$/, "")}tr`;
  }
  if (parsed >= 1000) {
    return `${Math.round(parsed / 1000)}k`;
  }
  return String(parsed);
};

const getPreviewPriceLabel = (place) => {
  const compactFrom = formatCompactPrice(place?.priceFrom ?? place?.price_from);
  if (compactFrom) return `Từ ${compactFrom}đ`;

  const priceRangeKey = String(place?.priceRange || "").toUpperCase();
  return PRICE_RANGE_LABELS[priceRangeKey] || "Liên hệ";
};

export const PlacePreviewCard = memo(
  ({
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
    detailLabel = "Xem chi tiết",
    selectedLabel = "Đã chọn",
    unselectedLabel = "Chọn",
    addToTripLabel = "Thêm vào chuyến đi",
    routeActionLabel = "Chỉ đường",
    showCloseButton = true,
    showDetailAction = true,
    showSelectionAction = false,
    showAddToTripAction = false,
    showRouteAction = false,
  }) => {
    if (!place) return null;

    const previewImg = resolvePlaceImageUri(place);
    const rating = getPlaceRatingValue(place);
    const reviewCount = getPlaceReviewCount(place);
    const locationLabel =
      place?.address ||
      [place?.ward?.name, place?.district?.name].filter(Boolean).join(", ") ||
      "Cần Thơ";
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
    const selectionLabel = selected ? selectedLabel : unselectedLabel;
    const hasTravelInfo = Boolean(travelEtaLabel || travelDistanceLabel);
    const travelLabel = travelLoading
      ? "Đang tính..."
      : [travelEtaLabel, travelDistanceLabel].filter(Boolean).join(" · ");

    return (
      <View
        className={cn(
          "flex-row items-center gap-[11px] p-[10px] rounded-[20px] border",
          "bg-white border-ink/6",
          compact && "rounded-2xl p-2 gap-[9px]",
          selected && "border-primary-400/30 bg-primary-50",
        )}
        style={{
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.06,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        <View
          className={cn(
            "w-20 h-20 rounded-[14px] overflow-hidden bg-slate-200",
            compact && "w-[68px] h-[68px] rounded-xl",
          )}
        >
          {previewImg ? (
            <Image
              source={{ uri: previewImg }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={160}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <MaterialIconsRounded name="place" size={22} color="#94A3B8" />
            </View>
          )}
        </View>

        <View className={cn("flex-1 min-w-0 gap-1", compact && "gap-[3px]")}>
          <View className="flex-row items-center gap-1.5">
            <Text
              numberOfLines={1}
              className={cn(
                "flex-1 text-ink font-heading tracking-tight text-[15px] leading-[19px]",
                compact && "text-sm leading-[18px]",
              )}
            >
              {place?.name || "Địa điểm"}
            </Text>
            {showCloseButton ? (
              <Pressable
                onPress={onClose}
                hitSlop={8}
                className="w-[22px] h-[22px] rounded-full items-center justify-center bg-slate-100"
              >
                <MaterialIconsRounded name="close" size={14} color="#94A3B8" />
              </Pressable>
            ) : null}
          </View>

          <View className="flex-row items-center gap-[3px]">
            <MaterialIconsRounded name="place" size={12} color="#64748B" />
            <Text
              numberOfLines={1}
              className={cn(
                "flex-shrink text-slate-500 font-medium text-[11px]",
                compact && "text-[10px]",
              )}
            >
              {locationLabel}
            </Text>
            {hasTravelInfo || travelLoading ? (
              <>
                <Text className="text-slate-300 font-medium text-[10px] mx-[1px]">·</Text>
                <MaterialIconsRounded name="directions-car" size={11} color="#0A84FF" />
                <Text numberOfLines={1} className="flex-shrink text-blue-500 font-semibold text-[11px]">
                  {travelLabel}
                </Text>
              </>
            ) : null}
          </View>

          <View className="flex-row items-center gap-1">
            {rating > 0 ? (
              <>
                <MaterialIconsRounded name="star" size={12} color="#F59E0B" />
                <Text className="text-slate-500 font-medium text-[11px]">{rating.toFixed(1)}</Text>
                <Text className="text-slate-300 font-medium text-[10px] mx-[1px]">·</Text>
              </>
            ) : null}
            <Text numberOfLines={1} className="text-slate-500 font-medium text-[11px]">
              {reviewLabel}
            </Text>
            {priceLabel ? (
              <>
                <Text className="text-slate-300 font-medium text-[10px] mx-[1px]">·</Text>
                <Text numberOfLines={1} className="text-slate-500 font-medium text-[11px]">
                  {priceLabel}
                </Text>
              </>
            ) : null}
          </View>

          <View className="flex-row items-center gap-1.5 mt-0.5">
            {canShowRouteAction ? (
              <Pressable
                onPress={() => onStartRoute(place)}
                className="flex-row items-center gap-1 rounded-full px-2.5 h-7 bg-blue-500"
                style={{
                  shadowColor: "#0A84FF",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <MaterialIconsRounded name="directions" size={14} color="#FFFFFF" />
                <Text className="text-white font-semibold text-[11px]">{routeActionLabel}</Text>
              </Pressable>
            ) : null}
            {canShowDetailAction ? (
              <Pressable
                onPress={() => onViewDetail(place)}
                className="flex-row items-center gap-1 rounded-full px-2.5 h-7 bg-ink"
              >
                <MaterialIconsRounded name="arrow-forward" size={13} color="#FFFFFF" />
                <Text className="text-white font-semibold text-[11px]">{detailLabel}</Text>
              </Pressable>
            ) : null}
            {canShowSelectionAction ? (
              <Pressable
                onPress={() => onToggleSelection(place)}
                className={cn(
                  "flex-row items-center gap-1 rounded-full px-2.5 h-7 border",
                  selected
                    ? "bg-ink border-ink"
                    : "bg-white border-ink/14",
                )}
              >
                <MaterialIconsRounded
                  name={selected ? "check-circle" : "radio-button-unchecked"}
                  size={13}
                  color={selected ? "#FFFFFF" : "#0F172A"}
                />
                <Text
                  className={cn(
                    "font-semibold text-[11px]",
                    selected ? "text-white" : "text-ink",
                  )}
                >
                  {selectionLabel}
                </Text>
              </Pressable>
            ) : null}
            {canShowAddToTripAction ? (
              <Pressable
                onPress={() => onAddToTrip(place)}
                className="flex-row items-center gap-1 rounded-full px-2.5 h-7 border border-ink/12 bg-slate-50"
              >
                <MaterialIconsRounded
                  name="playlist-add-check-circle"
                  size={13}
                  color="#0F172A"
                />
                <Text className="text-ink font-semibold text-[11px]">{addToTripLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  },
);

