import { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../constants/design-tokens";
import { resolvePlaceImageUri } from "../../lib/media-url";

const STITCH_PRIMARY = "#0F172A";
const STITCH_TEXT = "#0B1220";
const STITCH_MUTED = "#64748B";

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

const getPreviewOpenState = (place) => {
  const openingHours = Array.isArray(place?.openingHours)
    ? place.openingHours
    : [];

  if (openingHours.length === 0) {
    return {
      label: "Giờ mở cửa cập nhật sau",
      icon: "schedule",
      textColor: STITCH_MUTED,
      bgColor: "#F2F4F6",
    };
  }

  const now = new Date();
  const currentDay = now.getDay();
  const currentSchedule = openingHours.find(
    (item) => Number(item?.dayOfWeek) === currentDay,
  );

  if (!currentSchedule) {
    return {
      label: "Giờ mở cửa cập nhật sau",
      icon: "schedule",
      textColor: STITCH_MUTED,
      bgColor: "#F2F4F6",
    };
  }

  if (currentSchedule?.isClosed) {
    return {
      label: "Hôm nay đóng cửa",
      icon: "do-not-disturb-on",
      textColor: "#B91C1C",
      bgColor: "#FEE2E2",
    };
  }

  if (currentSchedule?.openTime && currentSchedule?.closeTime) {
    return {
      label: `${currentSchedule.openTime} - ${currentSchedule.closeTime}`,
      icon: "schedule",
      textColor: "#047857",
      bgColor: "#DCFCE7",
    };
  }

  return {
    label: "Mở cửa hôm nay",
    icon: "schedule",
    textColor: "#047857",
    bgColor: "#DCFCE7",
  };
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
    addToTripLabel = "Add vào trip",
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
    const categoryLabel = place?.category?.name || "Điểm đến nổi bật";
    const openState = getPreviewOpenState(place);
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

    return (
      <View
        style={[
          styles.card,
          compact && styles.cardCompact,
          selected && styles.cardSelected,
        ]}
      >
        <View
          style={[styles.thumbnailWrap, compact && styles.thumbnailWrapCompact]}
        >
          {previewImg ? (
            <Image
              source={{ uri: previewImg }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={160}
            />
          ) : (
            <View style={styles.thumbnailFallback}>
              <MaterialIcons name="place" size={24} color="#64748b" />
            </View>
          )}

          <View
            style={[
              styles.categoryBadge,
              compact && styles.categoryBadgeCompact,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.categoryText,
                compact && styles.categoryTextCompact,
              ]}
            >
              {categoryLabel}
            </Text>
          </View>
        </View>

        <View style={[styles.content, compact && styles.contentCompact]}>
          <View style={styles.headerRow}>
            <Text
              numberOfLines={2}
              style={[styles.title, compact && styles.titleCompact]}
            >
              {place?.name || "Địa điểm"}
            </Text>

            {showCloseButton ? (
              <Pressable
                onPress={onClose}
                style={[
                  styles.closeButton,
                  compact && styles.closeButtonCompact,
                ]}
              >
                <MaterialIcons name="close" size={16} color="#64748B" />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.locationRow}>
            <MaterialIcons
              name="place"
              size={compact ? 12 : 13}
              color={STITCH_PRIMARY}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.locationText,
                compact && styles.locationTextCompact,
              ]}
            >
              {locationLabel}
            </Text>
          </View>

          {travelLoading || hasTravelInfo ? (
            <View style={styles.travelInfoRow}>
              <MaterialIcons
                name="directions-car"
                size={compact ? 12 : 13}
                color="#0A84FF"
              />
              <View style={styles.travelInfoPill}>
                <Text
                  style={[
                    styles.travelInfoText,
                    compact && styles.travelInfoTextCompact,
                  ]}
                >
                  {travelLoading ? "Đang tính lộ trình..." : ""}
                  {!travelLoading && travelEtaLabel ? travelEtaLabel : ""}
                  {!travelLoading && travelEtaLabel && travelDistanceLabel
                    ? " • "
                    : ""}
                  {!travelLoading && travelDistanceLabel
                    ? travelDistanceLabel
                    : ""}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={[styles.metaRow, compact && styles.metaRowCompact]}>
            {rating > 0 ? (
              <View
                style={[styles.metaPill, compact && styles.metaPillCompact]}
              >
                <MaterialIcons
                  name="star"
                  size={compact ? 12 : 13}
                  color="#F59E0B"
                />
                <Text
                  style={[
                    styles.metaPillText,
                    compact && styles.metaPillTextCompact,
                  ]}
                >
                  {rating.toFixed(1)}
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
                  color={STITCH_PRIMARY}
                />
                <Text
                  numberOfLines={1}
                  style={[styles.priceText, compact && styles.priceTextCompact]}
                >
                  {priceLabel}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.footerRow, compact && styles.footerRowCompact]}>
            <View
              style={[
                styles.openStatePill,
                compact && styles.openStatePillCompact,
                { backgroundColor: openState.bgColor },
              ]}
            >
              <MaterialIcons
                name={openState.icon}
                size={compact ? 11 : 12}
                color={openState.textColor}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.openStateText,
                  compact && styles.openStateTextCompact,
                  { color: openState.textColor },
                ]}
              >
                {openState.label}
              </Text>
            </View>

            {canShowDetailAction ||
            canShowSelectionAction ||
            canShowAddToTripAction ||
            canShowRouteAction ? (
              <View
                style={[
                  styles.actionGroup,
                  compact && styles.actionGroupCompact,
                ]}
              >
                {canShowDetailAction ? (
                  <Pressable
                    onPress={() => onViewDetail(place)}
                    style={[
                      styles.detailButton,
                      compact && styles.actionButtonCompact,
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailButtonText,
                        compact && styles.actionButtonTextCompact,
                      ]}
                    >
                      {detailLabel}
                    </Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={compact ? 13 : 14}
                      color="#FFFFFF"
                    />
                  </Pressable>
                ) : null}

                {canShowSelectionAction ? (
                  <Pressable
                    onPress={() => onToggleSelection(place)}
                    style={[
                      styles.selectionButton,
                      selected && styles.selectionButtonActive,
                      compact && styles.actionButtonCompact,
                    ]}
                  >
                    <MaterialIcons
                      name={
                        selected ? "check-circle" : "radio-button-unchecked"
                      }
                      size={compact ? 13 : 14}
                      color={selected ? "#FFFFFF" : STITCH_PRIMARY}
                    />
                    <Text
                      style={[
                        styles.selectionButtonText,
                        selected && styles.selectionButtonTextActive,
                        compact && styles.actionButtonTextCompact,
                      ]}
                    >
                      {selectionLabel}
                    </Text>
                  </Pressable>
                ) : null}

                {canShowAddToTripAction ? (
                  <Pressable
                    onPress={() => onAddToTrip(place)}
                    style={[
                      styles.addToTripButton,
                      compact && styles.actionButtonCompact,
                    ]}
                  >
                    <MaterialIcons
                      name="playlist-add-check-circle"
                      size={compact ? 13 : 14}
                      color={STITCH_PRIMARY}
                    />
                    <Text
                      style={[
                        styles.addToTripButtonText,
                        compact && styles.actionButtonTextCompact,
                      ]}
                    >
                      {addToTripLabel}
                    </Text>
                  </Pressable>
                ) : null}

                {canShowRouteAction ? (
                  <Pressable
                    onPress={() => onStartRoute(place)}
                    style={[
                      styles.routeButton,
                      compact && styles.actionButtonCompact,
                    ]}
                  >
                    <MaterialIcons
                      name="directions"
                      size={compact ? 13 : 14}
                      color="#FFFFFF"
                    />
                    <Text
                      style={[
                        styles.routeButtonText,
                        compact && styles.actionButtonTextCompact,
                      ]}
                    >
                      {routeActionLabel}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    shadowColor: "#191c1e",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 26,
    elevation: 12,
  },
  cardCompact: {
    borderRadius: 20,
    padding: 10,
    gap: 10,
  },
  cardSelected: {
    borderColor: "rgba(14,165,233,0.32)",
    backgroundColor: "rgba(240,249,255,0.96)",
  },
  thumbnailWrap: {
    width: 96,
    height: 108,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#E0E3E5",
    position: "relative",
  },
  thumbnailWrapCompact: {
    width: 84,
    height: 96,
    borderRadius: 14,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBadge: {
    position: "absolute",
    left: 6,
    right: 6,
    bottom: 6,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    borderRadius: 999,
    paddingHorizontal: 8,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBadgeCompact: {
    left: 5,
    right: 5,
    bottom: 5,
    height: 22,
    paddingHorizontal: 7,
  },
  categoryText: {
    color: STITCH_PRIMARY,
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.3,
  },
  categoryTextCompact: {
    fontSize: 10,
  },
  content: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  contentCompact: {
    gap: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    flex: 1,
    color: STITCH_TEXT,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.2,
  },
  titleCompact: {
    fontSize: 15,
    lineHeight: 19,
  },
  closeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
  },
  closeButtonCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    flex: 1,
    color: STITCH_MUTED,
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
  },
  locationTextCompact: {
    fontSize: 11,
  },
  travelInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  travelInfoPill: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "rgba(10,132,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(10,132,255,0.22)",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  travelInfoText: {
    color: "#0B3A66",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  travelInfoTextCompact: {
    fontSize: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaRowCompact: {
    gap: 6,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 999,
    paddingHorizontal: 8,
    height: 24,
  },
  metaPillCompact: {
    height: 22,
    paddingHorizontal: 7,
  },
  metaPillText: {
    color: "#92400E",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  metaPillTextCompact: {
    fontSize: 10,
  },
  reviewText: {
    flex: 1,
    color: STITCH_MUTED,
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
    backgroundColor: "rgba(15,23,42,0.06)",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.12)",
    borderRadius: 999,
    paddingHorizontal: 8,
    height: 24,
    maxWidth: 112,
  },
  pricePillCompact: {
    height: 22,
    paddingHorizontal: 7,
    maxWidth: 96,
  },
  priceText: {
    color: STITCH_PRIMARY,
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  priceTextCompact: {
    fontSize: 10,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  footerRowCompact: {
    gap: 6,
  },
  openStatePill: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    height: 26,
  },
  openStatePillCompact: {
    height: 24,
    paddingHorizontal: 7,
  },
  openStateText: {
    flex: 1,
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  openStateTextCompact: {
    fontSize: 10,
  },
  actionGroup: {
    width: 132,
    gap: 6,
  },
  actionGroupCompact: {
    width: 116,
    gap: 5,
  },
  actionButtonCompact: {
    height: 28,
    paddingHorizontal: 10,
  },
  actionButtonTextCompact: {
    fontSize: 11,
  },
  detailButton: {
    height: 30,
    borderRadius: 999,
    backgroundColor: "#0F172A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
    shadowColor: "#191c1e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
  },
  detailButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.2,
  },
  selectionButton: {
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.16)",
    backgroundColor: "rgba(255,255,255,0.94)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
  },
  selectionButtonActive: {
    borderColor: STITCH_PRIMARY,
    backgroundColor: STITCH_PRIMARY,
  },
  selectionButtonText: {
    color: STITCH_PRIMARY,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.1,
  },
  selectionButtonTextActive: {
    color: "#FFFFFF",
  },
  addToTripButton: {
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.14)",
    backgroundColor: "rgba(248,250,252,0.96)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
  },
  addToTripButtonText: {
    color: STITCH_PRIMARY,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.1,
  },
  routeButton: {
    height: 30,
    borderRadius: 999,
    backgroundColor: "#0A84FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
    shadowColor: "#0A84FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  routeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.2,
  },
});
