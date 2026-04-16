import { memo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import TurnCard from "../navigation/TurnCard";
import { MAP_TEXT } from "../../constants/mapText.constants";

const RouteBuilderPanel = memo(function RouteBuilderPanel({
  visible,
  bottomOffset,
  statusLabel,
  draftStops,
  canConfirm,
  hasConfirmedRoute,
  isDirty,
  minimumStops,
  enabled,
  pendingArrival,
  recoveryMode,
  activeTargetName,
  distanceToActiveTargetLabel,
  completedLegs,
  legCount,
  hasPendingArrival,
  completedView,
  etaLabel,
  distanceLabel,
  isRouteError,
  isRouteFetching,
  onExit,
  onRemoveStop,
  onConfirmRoute,
  onClear,
  onConfirmArrived,
  onResetProgress,
  onToggleCompletedView,
  onRetryRoute,
}) {
  if (!visible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        bottom: bottomOffset,
        zIndex: 73,
      }}
    >
      <View
        style={{
          borderRadius: 16,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "#E2E8F0",
          shadowColor: "#0F172A",
          shadowOpacity: 0.1,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 5,
        }}
      >
        <View className="flex-row items-center gap-2">
          <View style={{ flex: 1 }}>
            <View className="flex-row items-center gap-1.5">
              <MaterialIcons name="alt-route" size={16} color="#0F172A" />
              <Text
                className="text-[13px] font-semibold"
                style={{ color: "#0F172A" }}
              >
                {MAP_TEXT.routeBuilder.panelTitle}
              </Text>
            </View>
            <Text className="text-[11px] mt-0.5" style={{ color: "#64748B" }}>
              {statusLabel ||
                MAP_TEXT.routeBuilder.statusHint({
                  draftCount: draftStops.length,
                  canConfirm,
                  minimumStops,
                })}
            </Text>
          </View>

          <Pressable
            onPress={onExit}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#CBD5E1",
            }}
          >
            <MaterialIcons name="close" size={16} color="#334155" />
          </Pressable>
        </View>

        {draftStops.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: 7,
              paddingVertical: 7,
              paddingRight: 6,
            }}
            style={{ marginTop: 4 }}
          >
            {draftStops.map((stop, index) => (
              <TurnCard
                key={`builder-stop-chip-${stop.id}`}
                index={index}
                name={stop?.name}
                onRemove={() => onRemoveStop(stop.id)}
              />
            ))}
          </ScrollView>
        ) : (
          <View
            className="flex-row items-center gap-2 mt-2"
            style={{
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 8,
              backgroundColor: "#F8FAFC",
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          >
            <MaterialIcons name="touch-app" size={14} color="#64748B" />
            <Text className="text-[11px]" style={{ color: "#64748B" }}>
              {MAP_TEXT.routeBuilder.noStopNotice}
            </Text>
          </View>
        )}

        <View className="flex-row items-center gap-2 mt-2">
          <Pressable
            onPress={onConfirmRoute}
            disabled={!canConfirm}
            className="h-[34px] rounded-full items-center justify-center"
            style={{
              flex: 1,
              backgroundColor: canConfirm ? "#0F172A" : "#94A3B8",
            }}
          >
            <Text
              className="text-[11px] font-semibold"
              style={{ color: "#FFFFFF" }}
            >
              {hasConfirmedRoute && isDirty
                ? MAP_TEXT.routeBuilder.updateRoute
                : MAP_TEXT.routeBuilder.confirmRoute}
            </Text>
          </Pressable>

          <Pressable
            onPress={onClear}
            className="h-[34px] rounded-full items-center justify-center"
            style={{
              width: 84,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#CBD5E1",
            }}
          >
            <Text
              className="text-[11px] font-semibold"
              style={{ color: "#334155" }}
            >
              {MAP_TEXT.routeBuilder.clearAll}
            </Text>
          </Pressable>
        </View>

        {enabled ? (
          <>
            {pendingArrival ? (
              <View
                className="mt-2 flex-row items-center gap-2"
                style={{
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  backgroundColor: "#ECFDF5",
                  borderWidth: 1,
                  borderColor: "#BBF7D0",
                }}
              >
                <MaterialIcons name="check-circle" size={15} color="#059669" />
                <Text
                  className="text-[10.5px]"
                  style={{ color: "#047857", flex: 1 }}
                >
                  {MAP_TEXT.routeBuilder.pendingArrivalNotice(
                    pendingArrival.targetName,
                  )}
                </Text>
              </View>
            ) : null}

            {recoveryMode ? (
              <View
                className="mt-2 flex-row items-center justify-between gap-2"
                style={{
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  backgroundColor: "#FEF2F2",
                  borderWidth: 1,
                  borderColor: "#FECACA",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    className="text-[11px] font-semibold"
                    style={{ color: "#B91C1C" }}
                  >
                    {MAP_TEXT.routeBuilder.recoveryTitle}
                  </Text>
                  <Text
                    className="text-[10px] mt-0.5"
                    style={{ color: "#991B1B" }}
                  >
                    {MAP_TEXT.routeBuilder.recoveryMessage(
                      activeTargetName,
                      distanceToActiveTargetLabel,
                    )}
                  </Text>
                </View>
                <MaterialIcons
                  name="subdirectory-arrow-left"
                  size={18}
                  color="#B91C1C"
                />
              </View>
            ) : null}

            <View className="flex-row items-center gap-2 mt-2">
              <View
                style={{
                  flex: 1,
                  height: 32,
                  borderRadius: 999,
                  paddingHorizontal: 11,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  backgroundColor: "#F8FAFC",
                  justifyContent: "center",
                }}
              >
                <Text
                  className="text-[10.5px]"
                  style={{ color: "#0F172A" }}
                  numberOfLines={1}
                >
                  {MAP_TEXT.routeBuilder.progressLabel(completedLegs, legCount)}
                </Text>
              </View>

              <Pressable
                onPress={onConfirmArrived}
                disabled={!hasPendingArrival}
                className="h-[32px] w-[32px] rounded-full items-center justify-center"
                style={{
                  backgroundColor: hasPendingArrival ? "#0F172A" : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: hasPendingArrival ? "#0F172A" : "#CBD5E1",
                }}
              >
                <MaterialIcons
                  name="check"
                  size={16}
                  color={hasPendingArrival ? "#FFFFFF" : "#94A3B8"}
                />
              </Pressable>

              <Pressable
                onPress={onResetProgress}
                className="h-[32px] w-[32px] rounded-full items-center justify-center"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#CBD5E1",
                }}
              >
                <MaterialIcons name="refresh" size={16} color="#334155" />
              </Pressable>

              <Pressable
                onPress={onToggleCompletedView}
                className="h-[32px] w-[32px] rounded-full items-center justify-center"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#CBD5E1",
                }}
              >
                <MaterialIcons
                  name={
                    completedView === "dim" ? "visibility-off" : "visibility"
                  }
                  size={16}
                  color="#334155"
                />
              </Pressable>
            </View>

            {etaLabel || distanceLabel ? (
              <View className="flex-row items-center gap-1.5 mt-2">
                {etaLabel ? (
                  <View
                    style={{
                      borderRadius: 999,
                      height: 24,
                      paddingHorizontal: 10,
                      justifyContent: "center",
                      backgroundColor: "#F8FAFC",
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                    }}
                  >
                    <Text className="text-[10px]" style={{ color: "#0F172A" }}>
                      {MAP_TEXT.routeBuilder.etaPrefix} {etaLabel}
                    </Text>
                  </View>
                ) : null}
                {distanceLabel ? (
                  <View
                    style={{
                      borderRadius: 999,
                      height: 24,
                      paddingHorizontal: 10,
                      justifyContent: "center",
                      backgroundColor: "#F8FAFC",
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                    }}
                  >
                    <Text className="text-[10px]" style={{ color: "#0F172A" }}>
                      {distanceLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {isRouteError ? (
              <View
                className="mt-2 flex-row items-center justify-between"
                style={{
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  backgroundColor: "#FEF2F2",
                  borderWidth: 1,
                  borderColor: "#FECACA",
                }}
              >
                <Text className="text-[11px]" style={{ color: "#B91C1C" }}>
                  {MAP_TEXT.errors.routeBuild}
                </Text>
                <Pressable
                  onPress={onRetryRoute}
                  disabled={isRouteFetching}
                  className="h-[26px] w-[26px] rounded-full items-center justify-center"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderWidth: 1,
                    borderColor: "#FCA5A5",
                  }}
                >
                  <MaterialIcons name="refresh" size={13} color="#B91C1C" />
                </Pressable>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
});

export default RouteBuilderPanel;
