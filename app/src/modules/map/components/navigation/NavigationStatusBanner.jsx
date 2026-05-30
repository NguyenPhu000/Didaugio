import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../../constants/design-tokens";
import { MAP_TEXT } from "../../constants/mapText.constants";

const NavigationStatusBanner = memo(function NavigationStatusBanner({
  visible,
  routeStatus,
  routeEtaLabel,
  routeDistanceLabel,
  isRouteFetching,
  bottomOffset,
  onRetry,
}) {
  if (!visible || !routeStatus) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.bannerOuter,
        {
          bottom: bottomOffset,
        },
      ]}
    >
      <BlurView
        tint="dark"
        intensity={28}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 11,
          borderRadius: 14,
          overflow: "hidden",
          borderWidth: 1,
          backgroundColor:
            routeStatus.type === "error"
              ? "rgba(255,245,245,0.94)"
              : "rgba(255,255,255,0.94)",
          borderColor:
            routeStatus.type === "error"
              ? "rgba(251,113,133,0.28)"
              : "rgba(15,23,42,0.08)",
        }}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <MaterialIcons
              name={routeStatus.icon}
              size={16}
              color={routeStatus.type === "error" ? "#E11D48" : "#0EA5E9"}
            />
            <Text style={styles.headerTitle}>
              {routeStatus.title}
            </Text>
          </View>

          {routeEtaLabel || routeDistanceLabel ? (
            <View style={styles.badge}>
              {routeEtaLabel ? (
                <Text
                  style={[
                    styles.badgeEtaText,
                    {
                      fontFamily: TOKENS.font.semibold,
                    },
                  ]}
                >
                  {routeEtaLabel}
                </Text>
              ) : null}
              {routeEtaLabel && routeDistanceLabel ? (
                <Text style={styles.badgeDot}>
                  •
                </Text>
              ) : null}
              {routeDistanceLabel ? (
                <Text style={styles.badgeDistanceText}>
                  {routeDistanceLabel}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <Text style={styles.messageText}>
          {routeStatus.message}
        </Text>

        {routeStatus.type !== "error" &&
        (routeEtaLabel || routeDistanceLabel) ? (
          <Text style={styles.subInfoText}>
            {routeStatus.type === "fallback"
              ? MAP_TEXT.navigationStatusBanner.fallbackInfo
              : MAP_TEXT.navigationStatusBanner.optimizedInfo}
          </Text>
        ) : null}

        {routeStatus.canRetry ? (
          <Pressable
            onPress={onRetry}
            disabled={isRouteFetching}
            style={[
              styles.retryBtn,
              {
                opacity: isRouteFetching ? 0.7 : 1,
              },
            ]}
          >
            <Text style={styles.retryBtnText}>
              {isRouteFetching
                ? MAP_TEXT.navigationStatusBanner.retryingRoute
                : MAP_TEXT.navigationStatusBanner.retryRoute}
            </Text>
          </Pressable>
        ) : null}
      </BlurView>
    </View>
  );
});

const styles = StyleSheet.create({
  bannerOuter: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 72,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "between",
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.2)",
    borderRadius: 13,
    paddingHorizontal: 10,
    height: 26,
  },
  badgeEtaText: {
    fontSize: 11,
    color: "#0C4A6E",
    fontWeight: "600",
  },
  badgeDot: {
    fontSize: 11,
    color: "#64748B",
  },
  badgeDistanceText: {
    fontSize: 11,
    color: "#334155",
  },
  messageText: {
    fontSize: 11,
    marginTop: 4,
    color: "#475569",
  },
  subInfoText: {
    fontSize: 10,
    marginTop: 4,
    color: "#64748B",
  },
  retryBtn: {
    marginTop: 8,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  retryBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F172A",
  },
});

export default NavigationStatusBanner;
