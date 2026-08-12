import React, { memo, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { resolvePlaceImageUri, resolveMediaUrl } from "../../../lib/media-url";
import { getTransportIcon } from "../../trips/utils/tripHelpers";
import {
  buildTripPreviewReview,
  getTripPreviewSheetHeight,
} from "../utils/tripRoutePreview";
import ActiveTripNavBanner from "./navigation/ActiveTripNavBanner";
import NearbyWarningBanner from "./navigation/NearbyWarningBanner";
import DepartureReminderBanner from "./navigation/DepartureReminderBanner";

// ==========================================
// 1. TOP CONTROLS: PAUSE / STOP BUTTONS
// ==========================================
const ActiveTripQuickControls = memo(function ActiveTripQuickControls({
  topOffset,
  handlePauseActiveTrip,
  t,
}) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        top: topOffset,
        zIndex: 82,
        alignItems: "flex-end",
      }}
    >
      <BlurView
        tint="dark"
        intensity={45}
        style={{
          flexDirection: "row",
          padding: 5,
          borderRadius: 22,
          overflow: "hidden",
          backgroundColor: "rgba(18, 24, 38, 0.82)",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.12)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Pressable
          onPress={handlePauseActiveTrip}
          className="flex-row items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#FFD60A]/20 active:opacity-75 active:scale-95"
        >
          <MaterialIconsRounded name="pause" size={16} color="#FFD60A" />
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 12,
              fontFamily: TOKENS.font.semibold,
            }}
          >
            {t("mapScreen.pauseJourney")}
          </Text>
        </Pressable>
      </BlurView>
    </View>
  );
});

// ==========================================
// 2. WARNING: GPS LOST BANNER
// ==========================================
const GpsSignalLostBanner = memo(function GpsSignalLostBanner({
  topOffset,
  mapText,
  estimatedPosition,
}) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        top: topOffset,
        zIndex: 75,
        alignItems: "center",
      }}
    >
      <View
        className="flex-row items-center gap-2.5 px-3.5 py-2.5 rounded-2xl"
        style={{
          backgroundColor: "rgba(30, 41, 59, 0.94)",
          borderWidth: 1,
          borderColor: "rgba(148, 163, 184, 0.25)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 6,
          elevation: 5,
        }}
      >
        <MaterialIconsRounded name="signal-cellular-off" size={18} color="#94A3B8" />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#F1F5F9",
              fontSize: 12.5,
              fontFamily: TOKENS.font.semibold,
            }}
          >
            {mapText.navigation.signalLost}
          </Text>
          {estimatedPosition ? (
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 11,
                fontFamily: TOKENS.font.medium,
                marginTop: 1,
              }}
            >
              {mapText.navigation.signalLostSubtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
});

// ==========================================
// 3. BROADCAST NOTICE BANNER
// ==========================================
const BroadcastNoticeBanner = memo(function BroadcastNoticeBanner({
  topOffset,
  broadcastNotice,
  t,
}) {
  return (
    <View
      pointerEvents="auto"
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        top: topOffset,
        zIndex: 99,
      }}
    >
      <View
        className="flex-row items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-red-600 border border-red-500"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <MaterialIconsRounded name="warning" size={18} color="#FFFFFF" />
        <Text
          style={{
            flex: 1,
            color: "#FFFFFF",
            fontSize: 12,
            fontFamily: TOKENS.font.bold,
            lineHeight: 16,
          }}
          numberOfLines={2}
        >
          {t("mapScreen.broadcastFrom", { notice: broadcastNotice })}
        </Text>
      </View>
    </View>
  );
});

// ==========================================
// 4. BOTTOM BANNER: JOURNEY PAUSED STATE
// ==========================================
const JourneyPausedBanner = memo(function JourneyPausedBanner({
  bottomOffset,
  handleResumeActiveTrip,
  handleRequestStopActiveTrip,
  t,
}) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        bottom: bottomOffset,
        zIndex: 80,
      }}
    >
      <BlurView
        tint="dark"
        intensity={50}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 24,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.14)",
          backgroundColor: "rgba(15, 23, 42, 0.92)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <View className="flex-1 flex-row items-center gap-2.5">
          <MaterialIconsRounded name="pause-circle-filled" size={26} color="#FFD60A" />
          <View className="flex-1">
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontFamily: TOKENS.font.semibold,
              }}
            >
              {t("mapScreen.journeyPaused")}
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 11,
                fontFamily: TOKENS.font.medium,
                marginTop: 1,
              }}
            >
              {t("mapScreen.journeyPausedDesc")}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={handleResumeActiveTrip}
            className="h-9 px-3.5 rounded-full bg-[#007BFF] justify-center items-center active:opacity-80 active:scale-95"
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 12,
                fontFamily: TOKENS.font.semibold,
              }}
            >
              {t("mapScreen.resume")}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleRequestStopActiveTrip}
            className="h-9 px-3.5 rounded-full bg-red-500/20 border border-red-300/30 justify-center items-center active:opacity-80 active:scale-95"
          >
            <Text
              style={{
                color: "#FCA5A5",
                fontSize: 12,
                fontFamily: TOKENS.font.semibold,
              }}
            >
              {t("mapScreen.stopJourney")}
            </Text>
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
});

// ==========================================
// 5. BOTTOM HUD: ACTIVE DESTINATION CARD
// ==========================================
const ActiveDestinationHUD = memo(function ActiveDestinationHUD({
  bottomOffset,
  activeTargetPoint,
  activeRouteDistanceLabel,
  activeRouteEtaLabel,
}) {
  const imageUri =
    resolvePlaceImageUri(activeTargetPoint?.place || activeTargetPoint) ||
    resolveMediaUrl(activeTargetPoint?.thumbnail);

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        bottom: bottomOffset,
        zIndex: 88,
      }}
    >
      <BlurView
        tint="dark"
        intensity={55}
        style={{
          borderRadius: 24,
          overflow: "hidden",
          backgroundColor: "rgba(17, 24, 39, 0.90)",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.14)",
          padding: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        <View className="flex-row items-center gap-3">
          {/* Thumbnail & Sequence Badge */}
          <View className="relative">
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                overflow: "hidden",
                backgroundColor: "#1F2937",
                borderWidth: 1.5,
                  borderColor: "#F5C451",
              }}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <MaterialIconsRounded name="place" size={22} color="#F5C451" />
                </View>
              )}
            </View>

            <View
              style={{
                position: "absolute",
                top: -6,
                left: -6,
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "#181819",
                borderWidth: 1.5,
                borderColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 3,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 10.5,
                  fontFamily: TOKENS.font.bold,
                }}
              >
                {activeTargetPoint?.sequence || 1}
              </Text>
            </View>
          </View>

          {/* Meta Information */}
          <View className="flex-1 gap-1">
            <Text
              numberOfLines={1}
              style={{
                color: "#FFFFFF",
                fontSize: 15,
                fontFamily: TOKENS.font.bold,
                letterSpacing: -0.3,
              }}
            >
              {activeTargetPoint?.name || activeTargetPoint?.place?.name || "Điểm tiếp theo"}
            </Text>

            <View className="flex-row items-center gap-1.5">
              <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20">
                <MaterialIconsRounded name="navigation" size={11} color="#F5C451" />
                <Text
                  style={{
                    color: "#F5C451",
                    fontSize: 11,
                    fontFamily: TOKENS.font.bold,
                  }}
                >
                  {activeRouteDistanceLabel || "Đang dẫn đường"}
                </Text>
              </View>

              {activeRouteEtaLabel ? (
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    fontSize: 11,
                    fontFamily: TOKENS.font.medium,
                  }}
                >
                  • {activeRouteEtaLabel}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </BlurView>
    </View>
  );
});

// ==========================================
// 6. BOTTOM CARD: TRIP PREVIEW MODE
// ==========================================
const formatPreviewDuration = (seconds, t, approximate = false) => {
  const totalSeconds = Number(seconds);
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;

  const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const key = hours
    ? approximate
      ? "mapScreen.previewApproximateHoursMinutes"
      : "mapScreen.previewHoursMinutes"
    : approximate
      ? "mapScreen.previewApproximateMinutes"
      : "mapScreen.previewMinutes";

  return t(key, { hours, minutes: hours ? minutes : totalMinutes });
};

const TripPreviewCard = memo(function TripPreviewCard({
  bottomInset,
  previewTrip,
  previewStops,
  previewSegments,
  previewDays,
  selectedPreviewDay,
  onSelectPreviewDay,
  isSelectedPreviewDayStartAllowed,
  isPreviewTripLoading,
  isPreviewRouteLoading,
  isPreviewRouteError,
  updatePreviewTripMutation,
  handleCancelTripPreview,
  handleConfirmTripPreview,
  t,
}) {
  const { height: viewportHeight } = useWindowDimensions();
  const isDisabled =
    previewStops.length === 0 ||
    updatePreviewTripMutation.isPending ||
    isPreviewTripLoading ||
    !isSelectedPreviewDayStartAllowed;
  const isExpiredDay = selectedPreviewDay?.status === "past";
  const dayStatusMessage = isExpiredDay
    ? t("mapScreen.previewExpiredMessage", {
        date: selectedPreviewDay.dateLabel,
      })
    : selectedPreviewDay?.status === "future"
      ? t("mapScreen.previewAvailableFrom", {
          date: selectedPreviewDay.dateLabel,
        })
      : null;
  const review = useMemo(
    () => buildTripPreviewReview(previewStops, previewSegments),
    [previewSegments, previewStops],
  );
  const fallbackDescription = review.fallbackSegmentCount
    ? t("mapScreen.previewFallbackCount", {
        count: review.fallbackSegmentCount,
      })
    : t("mapScreen.previewFallback");
  const sheetHeight = getTripPreviewSheetHeight(viewportHeight);
  const totalDurationLabel = formatPreviewDuration(review.totalDurationS, t, true);
  const summary = review.totalDistanceLabel && totalDurationLabel
    ? t("mapScreen.previewSummaryFull", {
        count: previewStops.length,
        segments: previewSegments.length,
        distance: review.totalDistanceLabel,
        duration: totalDurationLabel,
      })
    : t("mapScreen.previewSummary", {
        count: previewStops.length,
        segments: previewSegments.length,
      });
  const showFallbackWarning = isPreviewRouteError || review.fallbackSegmentCount > 0;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 88,
      }}
    >
      <BlurView
        tint="light"
        intensity={60}
        style={{
          height: sheetHeight,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          overflow: "hidden",
          backgroundColor: "rgba(255,255,255,0.99)",
          borderTopWidth: 1,
          borderColor: "rgba(17,24,39,0.08)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <View style={{ flex: 1, paddingTop: 12 }}>
          <View className="items-center pb-4">
            <View
              style={{
                width: 46,
                height: 5,
                borderRadius: 3,
                backgroundColor: "rgba(17,24,39,0.2)",
              }}
            />
          </View>

          <View className="px-5 pb-3">
            <View className="flex-row items-center gap-2">
              <Text
                numberOfLines={2}
                style={{
                  flex: 1,
                  color: "#111111",
                  fontSize: 27,
                  lineHeight: 32,
                  fontFamily: TOKENS.font.bold,
                  letterSpacing: -0.8,
                }}
              >
                {previewTrip?.title || t("mapScreen.previewTitle")}
              </Text>
              {isPreviewTripLoading || isPreviewRouteLoading ? (
                <ActivityIndicator size="small" color="#111111" />
              ) : null}
            </View>
            <Text
              numberOfLines={2}
              style={{
                marginTop: 5,
                color: "rgba(17,17,17,0.72)",
                fontSize: 13,
                lineHeight: 18,
                fontFamily: TOKENS.font.medium,
              }}
            >
              {summary}
            </Text>
          </View>

          {previewDays.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-3 pl-5"
            >
              <View className="flex-row gap-2 pr-5">
                {previewDays.map((day) => {
                  const isSelected = day.dayNumber === selectedPreviewDay?.dayNumber;
                  const daySubtitle = day.status === "past"
                    ? t("mapScreen.previewExpired")
                    : day.status === "today"
                      ? t("mapScreen.previewToday")
                      : day.dateLabel;
                  return (
                    <Pressable
                      key={day.dayNumber}
                      onPress={() => onSelectPreviewDay(day.dayNumber)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={t("mapScreen.previewDayTab", {
                        day: day.dayNumber,
                      })}
                      className={`min-w-[82px] rounded-xl border px-3 py-2 active:opacity-70 ${
                        isSelected
                          ? "border-[#171717] bg-[#171717]"
                          : "border-black/15 bg-white"
                      } ${day.status === "past" && !isSelected ? "opacity-65" : ""}`}
                    >
                      <Text
                        className={`font-semibold text-xs ${
                          isSelected ? "text-white" : "text-[#171717]"
                        }`}
                      >
                        {t("mapScreen.previewDayTab", { day: day.dayNumber })}
                      </Text>
                      <Text
                        className={`mt-0.5 text-[11px] ${
                          isSelected ? "text-white/70" : "text-black/55"
                        }`}
                      >
                        {daySubtitle}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          ) : null}

          {dayStatusMessage ? (
            <View
              className={`mx-5 mb-3 flex-row items-center gap-2 rounded-xl border px-3 py-2.5 ${
                isExpiredDay
                  ? "border-black/10 bg-[#F5F5F5]"
                  : "border-[#F2B544] bg-[#FFF9E8]"
              }`}
            >
              <MaterialIconsRounded
                name={isExpiredDay ? "event-busy" : "event"}
                size={17}
                color={isExpiredDay ? "#5C5C5C" : "#9A6200"}
              />
              <Text
                className={isExpiredDay ? "flex-1 font-medium text-xs text-[#5C5C5C]" : "flex-1 font-medium text-xs text-[#754A00]"}
              >
                {dayStatusMessage}
              </Text>
            </View>
          ) : null}

          {showFallbackWarning ? (
            <View
              className="mx-5 mb-3 flex-row items-center gap-2.5 rounded-2xl px-3.5 py-3"
              style={{
                backgroundColor: "#FFF9E8",
                borderWidth: 1,
                borderColor: "#F2B544",
              }}
            >
              <MaterialIconsRounded name="warning-amber" size={20} color="#9A6200" />
              <Text
                style={{
                  flex: 1,
                  color: "#754A00",
                  fontSize: 12.5,
                  lineHeight: 18,
                  fontFamily: TOKENS.font.semibold,
                }}
              >
                {fallbackDescription}
              </Text>
            </View>
          ) : null}

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {review.rows.map(({ stop, incomingSegment }, index) => {
              const isStartingPoint = index === 0;
              const isLastStop = index === review.rows.length - 1;
              const isFallbackSegment = incomingSegment?.source === "fallback";
              const durationLabel = formatPreviewDuration(incomingSegment?.durationS, t);
              const transportIcon = getTransportIcon(incomingSegment?.transportToNext);
              const travelLabel = [durationLabel, incomingSegment?.distanceLabel]
                .filter(Boolean)
                .join(" · ");

              return (
                <View
                  key={String(stop.id)}
                  className="flex-row"
                  style={isStartingPoint ? {
                    borderRadius: 16,
                    backgroundColor: "rgba(17,17,17,0.045)",
                    paddingTop: 10,
                    paddingHorizontal: 8,
                  } : { paddingHorizontal: 8 }}
                >
                  <View style={{ width: 38, alignItems: "center" }}>
                    <View
                      className="h-9 w-9 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: isStartingPoint ? "#000000" : "#FFFFFF",
                        borderWidth: 1.75,
                        borderColor: "#111111",
                      }}
                    >
                      {isLastStop && !isStartingPoint ? (
                        <MaterialIconsRounded name="flag" size={17} color="#111111" />
                      ) : (
                        <Text
                          style={{
                            color: isStartingPoint ? "#FFFFFF" : "#111111",
                            fontSize: 13,
                            fontFamily: TOKENS.font.bold,
                          }}
                        >
                          {stop.sequence}
                        </Text>
                      )}
                    </View>
                    {index < review.rows.length - 1 ? (
                      <View
                        style={{
                          width: 1.75,
                          flex: 1,
                          minHeight: 32,
                          backgroundColor: "#111111",
                        }}
                      />
                    ) : null}
                  </View>

                  <View
                    style={{
                      flex: 1,
                      minHeight: 68,
                      marginLeft: 12,
                      paddingRight: 2,
                      paddingBottom: index < review.rows.length - 1 ? 14 : 4,
                      borderBottomWidth: !isStartingPoint && !isLastStop ? 1 : 0,
                      borderBottomColor: "rgba(17,17,17,0.09)",
                    }}
                  >
                    <View className="flex-row items-center">
                      <View className="flex-1">
                        <Text
                          numberOfLines={2}
                          style={{
                            color: "#111111",
                            fontSize: 15.5,
                            lineHeight: 21,
                            fontFamily: TOKENS.font.semibold,
                          }}
                        >
                          {isStartingPoint ? t("mapScreen.previewStartPoint") : stop.name}
                        </Text>
                      </View>
                      {isStartingPoint ? (
                        <Pressable
                          onPress={handleConfirmTripPreview}
                          disabled={isDisabled}
                          accessibilityRole="button"
                          accessibilityLabel={isExpiredDay
                            ? t("mapScreen.previewExpiredCta")
                            : t("mapScreen.previewStartButton")}
                          className={`ml-3 h-9 flex-row items-center gap-1.5 rounded-xl px-3 active:opacity-60 ${
                            isDisabled ? "opacity-45" : ""
                          }`}
                          style={{
                            borderWidth: 1,
                            borderColor: "rgba(17,17,17,0.14)",
                            backgroundColor: "#FFFFFF",
                          }}
                        >
                          <MaterialIconsRounded name="play-arrow" size={17} color="#111111" />
                          <Text style={{ color: "#111111", fontSize: 12.5, fontFamily: TOKENS.font.semibold }}>
                            {isExpiredDay
                              ? t("mapScreen.previewExpiredCta")
                              : t("mapScreen.previewStartButton")}
                          </Text>
                        </Pressable>
                      ) : !isLastStop ? (
                        <MaterialIconsRounded name="chevron-right" size={24} color="rgba(17,17,17,0.75)" />
                      ) : null}
                    </View>
                    <View className="mt-1 flex-row items-center gap-1.5">
                      <MaterialIconsRounded
                        name={isStartingPoint ? "location-on" : transportIcon || "route"}
                        size={15}
                        color={isFallbackSegment ? "#9A6200" : "rgba(17,17,17,0.62)"}
                      />
                      <Text
                        style={{
                          color: isFallbackSegment ? "#754A00" : "rgba(17,17,17,0.66)",
                          fontSize: 12.5,
                          fontFamily: TOKENS.font.medium,
                        }}
                      >
                        {isStartingPoint
                          ? t("mapScreen.previewStartHere")
                          : isFallbackSegment
                            ? t("mapScreen.previewEstimatedSegment", {
                                distance: travelLabel || t("mapScreen.previewDistancePending"),
                              })
                            : travelLabel || t("mapScreen.previewDistancePending")}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View
            className="px-5 pt-3"
            style={{ borderTopWidth: 1, borderTopColor: "rgba(23,23,23,0.08)" }}
          >
            <Pressable
              onPress={handleConfirmTripPreview}
              disabled={isDisabled}
              accessibilityRole="button"
              accessibilityLabel={isExpiredDay
                ? t("mapScreen.previewExpiredCta")
                : t("mapScreen.startGuidance")}
              style={{
                height: 52,
                opacity: isDisabled ? 0.48 : 1,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.16)",
              }}
              className={`flex-row items-center justify-center gap-2 rounded-2xl active:opacity-80 ${
                isExpiredDay ? "bg-[#8B8B92]" : "bg-[#000000]"
              }`}
            >
              {updatePreviewTripMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIconsRounded name="navigation" size={20} color="#FFFFFF" />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 15,
                      fontFamily: TOKENS.font.bold,
                    }}
                  >
                    {isExpiredDay
                      ? t("mapScreen.previewExpiredCta")
                      : t("mapScreen.startGuidance")}
                  </Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={handleCancelTripPreview}
              accessibilityRole="button"
              accessibilityLabel={t("common.back")}
              className="h-10 items-center justify-center active:opacity-60"
            >
              <Text style={{ color: "#111111", fontSize: 13.5, fontFamily: TOKENS.font.semibold }}>
                {t("common.back")}
              </Text>
            </Pressable>
          </View>
          <View style={{ height: Math.max(bottomInset || 0, 12) }} />
        </View>
      </BlurView>
    </View>
  );
});

// ==========================================
// 7. MAIN OVERLAY CONTAINER
// ==========================================
export function MapScreenTripOverlays({
  activeDistanceToNextTurnLabel,
  activeDistanceToTarget,
  activeInstruction,
  activeInstructionIcon,
  activeRouteDistanceLabel,
  activeRouteEtaLabel,
  activeTargetPoint,
  activeTravelMode,
  activeTrip,
  activeUpcomingStep,
  broadcastNotice,
  departureReminder,
  floatingTabClearance,
  handleCancelTripPreview,
  handleConfirmTripPreview,
  handlePauseActiveTrip,
  handleRequestStopActiveTrip,
  handleResumeActiveTrip,
  handleToggleVoice,
  insets,
  isActiveRouteFetching,
  isActiveTripMode,
  isPreviewRouteError,
  isPreviewRouteLoading,
  isPreviewTripLoading,
  isTripPreviewMode,
  isVoiceMuted,
  mapText,
  navigationController,
  nearbyTriggered,
  previewSegments = [],
  previewDays = [],
  previewStops = [],
  previewTrip,
  selectedPreviewDay,
  onSelectPreviewDay,
  isSelectedPreviewDayStartAllowed,
  t,
  updatePreviewTripMutation,
}) {
  const topSafeArea = insets.top || 0;
  const isTripRunning = isActiveTripMode && !activeTrip?.isPaused;

  // Tính toán linh hoạt khoảng cách Top để tránh bị đè nhau
  const topAlertType = broadcastNotice
    ? "broadcast"
    : navigationController.isGpsLost
      ? "gpsLost"
      : nearbyTriggered
        ? "nearby"
        : null;
  const alertTopOffset = topSafeArea + 120;
  const controlsTopOffset = topSafeArea + (topAlertType ? 198 : 120);
  const bottomCardOffset = floatingTabClearance + 12;
  const departureReminderBottomOffset = bottomCardOffset + 112;

  return (
    <>
      {/* Dynamic Top Navigation Bar */}
      <ActiveTripNavBanner
        visible={isTripRunning}
        topOffset={topSafeArea + 12}
        instruction={activeInstruction}
        instructionIcon={activeInstructionIcon}
        targetName={activeTargetPoint?.name}
        streetName={activeUpcomingStep?.name}
        etaLabel={activeRouteEtaLabel}
        distanceLabel={activeRouteDistanceLabel}
        distanceToNextTurn={navigationController.distanceToNextTurn}
        distanceToNextTurnLabel={activeDistanceToNextTurnLabel}
        isFetching={isActiveRouteFetching}
        isOffRoute={navigationController.isOffRoute}
        isVoiceMuted={isVoiceMuted}
        travelMode={activeTravelMode}
        onToggleVoice={handleToggleVoice}
        onExit={handleRequestStopActiveTrip}
      />

      {/* Floating Quick Action Pill (Pause/Stop) */}
      {isTripRunning ? (
        <ActiveTripQuickControls
          topOffset={controlsTopOffset}
          handlePauseActiveTrip={handlePauseActiveTrip}
          t={t}
        />
      ) : null}

      {/* One status lane: only the highest-priority alert is visible. */}
      {topAlertType === "broadcast" ? (
        <BroadcastNoticeBanner
          topOffset={alertTopOffset}
          broadcastNotice={broadcastNotice}
          t={t}
        />
      ) : null}

      {topAlertType === "gpsLost" ? (
        <GpsSignalLostBanner
          topOffset={alertTopOffset}
          mapText={mapText}
          estimatedPosition={navigationController.estimatedPosition}
        />
      ) : null}

      {topAlertType === "nearby" ? (
        <NearbyWarningBanner
          visible
          topOffset={alertTopOffset}
          targetName={activeTargetPoint?.name}
          distanceMeters={activeDistanceToTarget ?? 0}
        />
      ) : null}

      {/* Departure reminder stays above the active destination HUD. */}
      {isTripRunning ? (
        <DepartureReminderBanner
          visible={Boolean(departureReminder)}
          bottomOffset={departureReminderBottomOffset}
          nextName={departureReminder?.nextName}
          minutesLeft={departureReminder?.minutesLeft ?? 10}
        />
      ) : null}

      {/* Bottom Paused Trip Control */}
      {isActiveTripMode && activeTrip?.isPaused ? (
        <JourneyPausedBanner
          bottomOffset={bottomCardOffset}
          handleResumeActiveTrip={handleResumeActiveTrip}
          handleRequestStopActiveTrip={handleRequestStopActiveTrip}
          t={t}
        />
      ) : null}

      {/* Active Trip Target Destination HUD */}
      {isTripRunning && activeTargetPoint ? (
        <ActiveDestinationHUD
          bottomOffset={bottomCardOffset}
          activeTargetPoint={activeTargetPoint}
          activeRouteDistanceLabel={activeRouteDistanceLabel}
          activeRouteEtaLabel={activeRouteEtaLabel}
        />
      ) : null}

      {/* Trip Preview Bottom Sheet Card */}
      {isTripPreviewMode ? (
        <TripPreviewCard
          bottomInset={insets.bottom}
          previewTrip={previewTrip}
          previewStops={previewStops}
          previewSegments={previewSegments}
          previewDays={previewDays}
          selectedPreviewDay={selectedPreviewDay}
          onSelectPreviewDay={onSelectPreviewDay}
          isSelectedPreviewDayStartAllowed={isSelectedPreviewDayStartAllowed}
          isPreviewTripLoading={isPreviewTripLoading}
          isPreviewRouteLoading={isPreviewRouteLoading}
          isPreviewRouteError={isPreviewRouteError}
          updatePreviewTripMutation={updatePreviewTripMutation}
          handleCancelTripPreview={handleCancelTripPreview}
          handleConfirmTripPreview={handleConfirmTripPreview}
          t={t}
        />
      ) : null}
    </>
  );
}

export default MapScreenTripOverlays;
