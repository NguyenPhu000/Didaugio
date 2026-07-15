import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIconsRounded } from "../../../components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../constants/design-tokens";
import ActiveTripNavBanner from "./navigation/ActiveTripNavBanner";
import NearbyWarningBanner from "./navigation/NearbyWarningBanner";
import DepartureReminderBanner from "./navigation/DepartureReminderBanner";

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
  previewSegments,
  previewStops,
  previewTrip,
  t,
  updatePreviewTripMutation,
}) {
  return (
    <>
      <ActiveTripNavBanner
        visible={isActiveTripMode && !activeTrip.isPaused}
        topOffset={(insets.top || 0) + 12}
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

      {isActiveTripMode && !activeTrip.isPaused ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            top: (insets.top || 0) + 116,
            zIndex: 82,
            alignItems: "flex-end",
          }}
        >
          <BlurView
            tint="dark"
            intensity={34}
            style={{
              flexDirection: "row",
              gap: 8,
              padding: 6,
              borderRadius: 22,
              overflow: "hidden",
              backgroundColor: "rgba(17,24,39,0.86)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.16)",
            }}
          >
            <Pressable
              onPress={handlePauseActiveTrip}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                height: 38,
                paddingHorizontal: 12,
                borderRadius: 19,
                backgroundColor: "rgba(255,214,10,0.18)",
              }}
            >
              <MaterialIconsRounded name="pause" size={17} color="#FFD60A" />
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: TOKENS.font.semibold }}>
                {t("mapScreen.pauseJourney")}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleRequestStopActiveTrip}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                height: 38,
                paddingHorizontal: 12,
                borderRadius: 19,
                backgroundColor: "rgba(239,68,68,0.2)",
              }}
            >
              <MaterialIconsRounded name="stop" size={17} color="#FCA5A5" />
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: TOKENS.font.semibold }}>
                {t("mapScreen.stopJourney")}
              </Text>
            </Pressable>
          </BlurView>
        </View>
      ) : null}

      <NearbyWarningBanner
        visible={isActiveTripMode && !activeTrip.isPaused && nearbyTriggered}
        topOffset={(insets.top || 0) + 94}
        targetName={activeTargetPoint?.name}
        distanceMeters={activeDistanceToTarget ?? 0}
      />

      {isActiveTripMode && navigationController.isGpsLost ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            top: (insets.top || 0) + 94,
            zIndex: 75,
            alignItems: "center",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: "rgba(30, 41, 59, 0.92)",
              borderWidth: 1,
              borderColor: "rgba(148, 163, 184, 0.24)",
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <MaterialIconsRounded name="signal-cellular-off" size={16} color="#94A3B8" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#E2E8F0",
                  fontSize: 13,
                  fontFamily: TOKENS.font.semibold,
                }}
              >
                {mapText.navigation.signalLost}
              </Text>
              {navigationController.estimatedPosition ? (
                <Text
                  style={{
                    color: "#94A3B8",
                    fontSize: 11,
                    fontFamily: TOKENS.font.medium,
                  }}
                >
                  {mapText.navigation.signalLostSubtitle}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

      {/* Broadcast Notice from Event Organizers */}
      {broadcastNotice ? (
        <View
          pointerEvents="auto"
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            top: isActiveTripMode ? (insets.top || 0) + 156 : (insets.top || 0) + 64,
            zIndex: 99,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#DC2626",
              borderWidth: 1,
              borderColor: "#EF4444",
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 5,
            }}
          >
            <MaterialIconsRounded name="warning" size={16} color="#FFFFFF" />
            <Text
              style={{
                flex: 1,
                color: "#FFFFFF",
                fontSize: 12,
                fontFamily: TOKENS.font.bold,
              }}
              numberOfLines={2}
            >
              {t("mapScreen.broadcastFrom", { notice: broadcastNotice })}
            </Text>
          </View>
        </View>
      ) : null}

      <DepartureReminderBanner
        visible={Boolean(departureReminder)}
        bottomOffset={floatingTabClearance + 12}
        nextName={departureReminder?.nextName}
        minutesLeft={departureReminder?.minutesLeft ?? 10}
      />

      {/* Banner khi Hành trình đang tạm nghỉ */}
      {isActiveTripMode && activeTrip.isPaused && (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            bottom: floatingTabClearance + 12,
            zIndex: 80,
          }}
        >
          <BlurView
            tint="dark"
            intensity={36}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 18,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.16)",
              backgroundColor: "rgba(16, 24, 32, 0.92)",
            }}
          >
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialIconsRounded name="pause-circle-filled" size={24} color="#FFD60A" />
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 14, fontFamily: TOKENS.font.semibold }}>
                  {t("mapScreen.journeyPaused")}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: TOKENS.font.medium }}>
                  {t("mapScreen.journeyPausedDesc")}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={handleResumeActiveTrip}
              style={{
                paddingHorizontal: 14,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#007BFF",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: TOKENS.font.semibold }}>
                {t("mapScreen.resume")}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleRequestStopActiveTrip}
              style={{
                paddingHorizontal: 14,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(239,68,68,0.2)",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(252,165,165,0.38)",
              }}
            >
              <Text style={{ color: "#FCA5A5", fontSize: 12, fontFamily: TOKENS.font.semibold }}>
                {t("mapScreen.stopJourney")}
              </Text>
            </Pressable>
          </BlurView>
        </View>
      )}

      {isTripPreviewMode ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            bottom: floatingTabClearance + 14,
            zIndex: 88,
          }}
        >
          <BlurView
            tint="light"
            intensity={46}
            style={{
              borderRadius: 24,
              overflow: "hidden",
              backgroundColor: "rgba(255,255,255,0.94)",
              borderWidth: 1,
              borderColor: "rgba(17,24,39,0.08)",
            }}
          >
            <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(16,185,129,0.12)",
                  }}
                >
                  {isPreviewTripLoading || isPreviewRouteLoading ? (
                    <ActivityIndicator size="small" color="#059669" />
                  ) : (
                    <MaterialIconsRounded name="route" size={20} color="#047857" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
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

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={handleCancelTripPreview}
                  style={{
                    height: 46,
                    paddingHorizontal: 16,
                    borderRadius: 23,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#F3F4F6",
                  }}
                >
                  <Text style={{ color: "#111827", fontSize: 13, fontFamily: TOKENS.font.semibold }}>
                    {t("common.back")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmTripPreview}
                  disabled={
                    previewStops.length === 0 ||
                    updatePreviewTripMutation.isPending ||
                    isPreviewTripLoading
                  }
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 23,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#111827",
                    opacity:
                      previewStops.length === 0 ||
                      updatePreviewTripMutation.isPending ||
                      isPreviewTripLoading
                        ? 0.55
                        : 1,
                  }}
                >
                  {updatePreviewTripMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: "#FFFFFF", fontSize: 14, fontFamily: TOKENS.font.bold }}>
                      {t("mapScreen.startGuidance")}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </BlurView>
        </View>
      ) : null}
    </>
  );
}
