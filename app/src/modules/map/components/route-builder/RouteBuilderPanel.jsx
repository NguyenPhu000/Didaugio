import { memo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
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
      style={[
        styles.panelOuter,
        {
          bottom: bottomOffset,
        },
      ]}
    >
      <View style={styles.panelInner}>
        <View style={styles.headerRow}>
          <View style={styles.flex1}>
            <View style={styles.titleRow}>
              <MaterialIconsRounded name="alt-route" size={16} color="#0F172A" />
              <Text style={styles.titleText}>
                {MAP_TEXT.routeBuilder.panelTitle}
              </Text>
            </View>
            <Text style={styles.subtitleText}>
              {statusLabel ||
                MAP_TEXT.routeBuilder.statusHint({
                  draftCount: draftStops.length,
                  canConfirm,
                  minimumStops,
                })}
            </Text>
          </View>

          <Pressable onPress={onExit} style={styles.closeBtn}>
            <MaterialIconsRounded name="close" size={16} color="#334155" />
          </Pressable>
        </View>

        {draftStops.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
            style={styles.scrollView}
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
          <View style={styles.emptyNotice}>
            <MaterialIconsRounded name="touch-app" size={14} color="#64748B" />
            <Text style={styles.emptyNoticeText}>
              {MAP_TEXT.routeBuilder.noStopNotice}
            </Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <Pressable
            onPress={onConfirmRoute}
            disabled={!canConfirm}
            style={[
              styles.confirmBtn,
              {
                backgroundColor: canConfirm ? "#0F172A" : "#94A3B8",
              },
            ]}
          >
            <Text style={styles.confirmBtnText}>
              {hasConfirmedRoute && isDirty
                ? MAP_TEXT.routeBuilder.updateRoute
                : MAP_TEXT.routeBuilder.confirmRoute}
            </Text>
          </Pressable>

          <Pressable onPress={onClear} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>
              {MAP_TEXT.routeBuilder.clearAll}
            </Text>
          </Pressable>
        </View>

        {enabled ? (
          <>
            {pendingArrival ? (
              <View style={styles.arrivalNotice}>
                <MaterialIconsRounded name="check-circle" size={15} color="#059669" />
                <Text style={styles.arrivalNoticeText}>
                  {MAP_TEXT.routeBuilder.pendingArrivalNotice(
                    pendingArrival.targetName,
                  )}
                </Text>
              </View>
            ) : null}

            {recoveryMode ? (
              <View style={styles.recoveryNotice}>
                <View style={styles.flex1}>
                  <Text style={styles.recoveryTitle}>
                    {MAP_TEXT.routeBuilder.recoveryTitle}
                  </Text>
                  <Text style={styles.recoveryText}>
                    {MAP_TEXT.routeBuilder.recoveryMessage(
                      activeTargetName,
                      distanceToActiveTargetLabel,
                    )}
                  </Text>
                </View>
                <MaterialIconsRounded
                  name="subdirectory-arrow-left"
                  size={18}
                  color="#B91C1C"
                />
              </View>
            ) : null}

            <View style={styles.progressRow}>
              <View style={styles.progressLabelWrap}>
                <Text style={styles.progressLabelText} numberOfLines={1}>
                  {MAP_TEXT.routeBuilder.progressLabel(completedLegs, legCount)}
                </Text>
              </View>

              <Pressable
                onPress={onConfirmArrived}
                disabled={!hasPendingArrival}
                style={[
                  styles.progressActionBtn,
                  {
                    backgroundColor: hasPendingArrival ? "#0F172A" : "#FFFFFF",
                    borderColor: hasPendingArrival ? "#0F172A" : "#CBD5E1",
                  },
                ]}
              >
                <MaterialIconsRounded
                  name="check"
                  size={16}
                  color={hasPendingArrival ? "#FFFFFF" : "#94A3B8"}
                />
              </Pressable>

              <Pressable onPress={onResetProgress} style={styles.progressSquareBtn}>
                <MaterialIconsRounded name="refresh" size={16} color="#334155" />
              </Pressable>

              <Pressable
                onPress={onToggleCompletedView}
                style={styles.progressSquareBtn}
              >
                <MaterialIconsRounded
                  name={
                    completedView === "dim" ? "visibility-off" : "visibility"
                  }
                  size={16}
                  color="#334155"
                />
              </Pressable>
            </View>

            {etaLabel || distanceLabel ? (
              <View style={styles.etaRow}>
                {etaLabel ? (
                  <View style={styles.etaBadge}>
                    <Text style={styles.etaBadgeText}>
                      {MAP_TEXT.routeBuilder.etaPrefix} {etaLabel}
                    </Text>
                  </View>
                ) : null}
                {distanceLabel ? (
                  <View style={styles.etaBadge}>
                    <Text style={styles.etaBadgeText}>
                      {distanceLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {isRouteError ? (
              <View style={styles.errorNotice}>
                <Text style={styles.errorText}>
                  {MAP_TEXT.errors.routeBuild}
                </Text>
                <Pressable
                  onPress={onRetryRoute}
                  disabled={isRouteFetching}
                  style={styles.errorRetryBtn}
                >
                  <MaterialIconsRounded name="refresh" size={13} color="#B91C1C" />
                </Pressable>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  panelOuter: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 73,
  },
  panelInner: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  titleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  subtitleText: {
    fontSize: 11,
    marginTop: 2,
    color: "#64748B",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  scrollView: {
    marginTop: 4,
  },
  scrollContainer: {
    gap: 7,
    paddingVertical: 7,
    paddingRight: 6,
  },
  emptyNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emptyNoticeText: {
    fontSize: 11,
    color: "#64748B",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  confirmBtn: {
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  confirmBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  clearBtn: {
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    width: 84,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },
  arrivalNotice: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  arrivalNoticeText: {
    fontSize: 10.5,
    color: "#047857",
    flex: 1,
  },
  recoveryNotice: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "between",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  recoveryTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#B91C1C",
  },
  recoveryText: {
    fontSize: 10,
    marginTop: 2,
    color: "#991B1B",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  progressLabelWrap: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
  },
  progressLabelText: {
    fontSize: 10.5,
    color: "#0F172A",
  },
  progressActionBtn: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  progressSquareBtn: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  etaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  etaBadge: {
    borderRadius: 12,
    height: 24,
    paddingHorizontal: 10,
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  etaBadgeText: {
    fontSize: 10,
    color: "#0F172A",
  },
  errorNotice: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "between",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    fontSize: 11,
    color: "#B91C1C",
  },
  errorRetryBtn: {
    height: 26,
    width: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
});

export default RouteBuilderPanel;
