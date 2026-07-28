import React, { memo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import { resolvePlaceImageUri, resolveMediaUrl } from "../../../lib/media-url";
import ActiveTripNavBanner from "./navigation/ActiveTripNavBanner";
import NearbyWarningBanner from "./navigation/NearbyWarningBanner";
import DepartureReminderBanner from "./navigation/DepartureReminderBanner";

// ==========================================
// 1. TOP CONTROLS: PAUSE / STOP BUTTONS
// ==========================================
const ActiveTripQuickControls = memo(function ActiveTripQuickControls({
  topOffset,
  handlePauseActiveTrip,
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
          gap: 6,
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

        <Pressable
          onPress={handleRequestStopActiveTrip}
          className="flex-row items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#EF4444]/20 active:opacity-75 active:scale-95"
        >
          <MaterialIconsRounded name="stop" size={16} color="#FCA5A5" />
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 12,
              fontFamily: TOKENS.font.semibold,
            }}
          >
            {t("mapScreen.stopJourney")}
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
                borderColor: "#38BDF8",
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
                  <MaterialIconsRounded name="place" size={22} color="#38BDF8" />
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
                <MaterialIconsRounded name="navigation" size={11} color="#34D399" />
                <Text
                  style={{
                    color: "#34D399",
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
const TripPreviewCard = memo(function TripPreviewCard({
  bottomOffset,
  previewTrip,
  previewStops,
  previewSegments,
  isPreviewTripLoading,
  isPreviewRouteLoading,
  isPreviewRouteError,
  updatePreviewTripMutation,
  handleCancelTripPreview,
  handleConfirmTripPreview,
  t,
}) {
  const isDisabled =
    previewStops.length === 0 ||
    updatePreviewTripMutation.isPending ||
    isPreviewTripLoading;

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
        tint="light"
        intensity={60}
        style={{
          borderRadius: 24,
          overflow: "hidden",
          backgroundColor: "rgba(255,255,255,0.95)",
          borderWidth: 1,
          borderColor: "rgba(17,24,39,0.08)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <View className="p-4 gap-3">
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-xl items-center justify-center bg-emerald-500/15">
              {isPreviewTripLoading || isPreviewRouteLoading ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <MaterialIconsRounded name="route" size={20} color="#047857" />
              )}
            </View>
            <View className="flex-1">
              <Text
                numberOfLines={1}
                style={{
                  color: "#111827",
                  fontSize: 16,
                  fontFamily: TOKENS.font.bold,
                }}
              >
                {previewTrip?.title || t("mapScreen.previewTitle")}
              </Text>
              <Text
                numberOfLines={1}
                style={{
                  marginTop: 2,
                  color: "#6B7280",
                  fontSize: 12,
                  fontFamily: TOKENS.font.medium,
                }}
              >
                {isPreviewRouteError
                  ? t("mapScreen.previewFallback")
                  : t("mapScreen.previewSummary", {
                      count: previewStops.length,
                      segments: previewSegments.length,
                    })}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2.5">
            <Pressable
              onPress={handleCancelTripPreview}
              className="h-11 px-4 rounded-2xl bg-gray-100 items-center justify-center active:bg-gray-200 active:scale-95"
            >
              <Text
                style={{
                  color: "#111827",
                  fontSize: 13,
                  fontFamily: TOKENS.font.semibold,
                }}
              >
                {t("common.back")}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirmTripPreview}
              disabled={isDisabled}
              style={{ opacity: isDisabled ? 0.55 : 1 }}
              className="flex-1 h-11 rounded-2xl bg-[#111827] items-center justify-center active:scale-98 shadow-sm"
            >
              {updatePreviewTripMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontFamily: TOKENS.font.bold,
                  }}
                >
                  {t("mapScreen.startGuidance")}
                </Text>
              )}
            </Pressable>
          </View>
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
  previewStops = [],
  previewTrip,
  t,
  updatePreviewTripMutation,
}) {
  const topSafeArea = insets.top || 0;
  const isTripRunning = isActiveTripMode && !activeTrip?.isPaused;

  // Tính toán linh hoạt khoảng cách Top để tránh bị đè nhau
  const controlsTopOffset = topSafeArea + 116;
  const gpsLostTopOffset = topSafeArea + 94;
  const broadcastTopOffset = isActiveTripMode ? topSafeArea + 160 : topSafeArea + 64;
  const bottomCardOffset = floatingTabClearance + 12;

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
          handleRequestStopActiveTrip={handleRequestStopActiveTrip}
          t={t}
        />
      ) : null}

      {/* Proximity Warning Banner */}
      <NearbyWarningBanner
        visible={isTripRunning && nearbyTriggered}
        topOffset={gpsLostTopOffset}
        targetName={activeTargetPoint?.name}
        distanceMeters={activeDistanceToTarget ?? 0}
      />

      {/* GPS Lost Warning */}
      {isActiveTripMode && navigationController.isGpsLost ? (
        <GpsSignalLostBanner
          topOffset={gpsLostTopOffset}
          mapText={mapText}
          estimatedPosition={navigationController.estimatedPosition}
        />
      ) : null}

      {/* Broadcast Emergency Notice */}
      {broadcastNotice ? (
        <BroadcastNoticeBanner
          topOffset={broadcastTopOffset}
          broadcastNotice={broadcastNotice}
          t={t}
        />
      ) : null}

      {/* Departure Reminder */}
      <DepartureReminderBanner
        visible={Boolean(departureReminder)}
        bottomOffset={bottomCardOffset}
        nextName={departureReminder?.nextName}
        minutesLeft={departureReminder?.minutesLeft ?? 10}
      />

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
          bottomOffset={bottomCardOffset + 2}
          previewTrip={previewTrip}
          previewStops={previewStops}
          previewSegments={previewSegments}
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
