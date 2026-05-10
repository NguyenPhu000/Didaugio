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
              <MaterialIcons name="place" size={22} color="#94A3B8" />
            </View>
          )}
        </View>

        <View style={[styles.content, compact && styles.contentCompact]}>
          <View style={styles.headerRow}>
            <Text
              numberOfLines={1}
              style={[styles.title, compact && styles.titleCompact]}
            >
              {place?.name || "Địa điểm"}
            </Text>
            {showCloseButton ? (
              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={14} color="#94A3B8" />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.locationRow}>
            <MaterialIcons
              name="place"
              size={12}
              color={STITCH_MUTED}
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
            {hasTravelInfo || travelLoading ? (
              <>
                <Text style={styles.dotSep}>·</Text>
                <MaterialIcons
                  name="directions-car"
                  size={11}
                  color="#0A84FF"
                />
                <Text numberOfLines={1} style={styles.travelText}>
                  {travelLabel}
                </Text>
              </>
            ) : null}
          </View>

          <View style={styles.metaRow}>
            {rating > 0 ? (
              <>
                <MaterialIcons
                  name="star"
                  size={12}
                  color="#F59E0B"
                />
                <Text style={styles.metaText}>{rating.toFixed(1)}</Text>
                <Text style={styles.dotSep}>·</Text>
              </>
            ) : null}
            <Text numberOfLines={1} style={styles.metaText}>
              {reviewLabel}
            </Text>
            {priceLabel ? (
              <>
                <Text style={styles.dotSep}>·</Text>
                <Text numberOfLines={1} style={styles.metaText}>
                  {priceLabel}
                </Text>
              </>
            ) : null}
          </View>

          <View style={styles.actionsRow}>
            {canShowRouteAction ? (
              <Pressable
                onPress={() => onStartRoute(place)}
                style={[styles.actionBtn, styles.routeBtn]}
              >
                <MaterialIcons name="directions" size={14} color="#FFFFFF" />
                <Text style={styles.routeBtnText}>{routeActionLabel}</Text>
              </Pressable>
            ) : null}
            {canShowDetailAction ? (
              <Pressable
                onPress={() => onViewDetail(place)}
                style={[styles.actionBtn, styles.detailBtn]}
              >
                <MaterialIcons name="arrow-forward" size={13} color="#FFFFFF" />
                <Text style={styles.detailBtnText}>{detailLabel}</Text>
              </Pressable>
            ) : null}
            {canShowSelectionAction ? (
              <Pressable
                onPress={() => onToggleSelection(place)}
                style={[
                  styles.actionBtn,
                  styles.selectionBtn,
                  selected && styles.selectionBtnActive,
                ]}
              >
                <MaterialIcons
                  name={selected ? "check-circle" : "radio-button-unchecked"}
                  size={13}
                  color={selected ? "#FFFFFF" : STITCH_PRIMARY}
                />
                <Text
                  style={[
                    styles.selectionBtnText,
                    selected && styles.selectionBtnTextActive,
                  ]}
                >
                  {selectionLabel}
                </Text>
              </Pressable>
            ) : null}
            {canShowAddToTripAction ? (
              <Pressable
                onPress={() => onAddToTrip(place)}
                style={[styles.actionBtn, styles.addTripBtn]}
              >
                <MaterialIcons
                  name="playlist-add-check-circle"
                  size={13}
                  color={STITCH_PRIMARY}
                />
                <Text style={styles.addTripBtnText}>{addToTripLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 10,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 8,
  },
  cardCompact: {
    borderRadius: 16,
    padding: 8,
    gap: 9,
  },
  cardSelected: {
    borderColor: "rgba(14,165,233,0.3)",
    backgroundColor: "rgba(240,249,255,0.97)",
  },
  thumbnailWrap: {
    width: 80,
    height: 80,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  thumbnailWrapCompact: {
    width: 68,
    height: 68,
    borderRadius: 12,
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
  content: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  contentCompact: {
    gap: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    flex: 1,
    color: STITCH_TEXT,
    fontSize: 15,
    lineHeight: 19,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.2,
  },
  titleCompact: {
    fontSize: 14,
    lineHeight: 18,
  },
  closeButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    color: STITCH_MUTED,
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
    flexShrink: 1,
  },
  locationTextCompact: {
    fontSize: 10,
  },
  dotSep: {
    color: "#CBD5E1",
    fontSize: 10,
    fontFamily: TOKENS.font.medium,
    marginHorizontal: 1,
  },
  travelText: {
    color: "#0A84FF",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: STITCH_MUTED,
    fontSize: 11,
    fontFamily: TOKENS.font.medium,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    height: 28,
  },
  routeBtn: {
    backgroundColor: "#0A84FF",
    shadowColor: "#0A84FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  routeBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  detailBtn: {
    backgroundColor: "#0F172A",
  },
  detailBtnText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  selectionBtn: {
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.14)",
    backgroundColor: "#FFFFFF",
  },
  selectionBtnActive: {
    borderColor: STITCH_PRIMARY,
    backgroundColor: STITCH_PRIMARY,
  },
  selectionBtnText: {
    color: STITCH_PRIMARY,
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
  selectionBtnTextActive: {
    color: "#FFFFFF",
  },
  addTripBtn: {
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.12)",
    backgroundColor: "#F8FAFC",
  },
  addTripBtnText: {
    color: STITCH_PRIMARY,
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
  },
});
