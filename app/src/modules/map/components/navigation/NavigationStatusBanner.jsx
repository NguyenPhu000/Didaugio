import { memo } from "react";
import { Pressable, Text, View } from "react-native";
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
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        bottom: bottomOffset,
        zIndex: 72,
      }}
    >
      <BlurView
        tint="dark"
        intensity={28}
        style={{
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 11,
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
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center gap-2" style={{ flex: 1 }}>
            <MaterialIcons
              name={routeStatus.icon}
              size={16}
              color={routeStatus.type === "error" ? "#E11D48" : "#0EA5E9"}
            />
            <Text
              className="text-[12px] font-semibold"
              style={{ color: "#0F172A" }}
            >
              {routeStatus.title}
            </Text>
          </View>

          {routeEtaLabel || routeDistanceLabel ? (
            <View
              className="flex-row items-center"
              style={{
                gap: 6,
                backgroundColor: "rgba(14,165,233,0.1)",
                borderColor: "rgba(14,165,233,0.2)",
                borderWidth: 1,
                borderRadius: 999,
                paddingHorizontal: 10,
                height: 26,
              }}
            >
              {routeEtaLabel ? (
                <Text
                  className="text-[11px]"
                  style={{
                    color: "#0C4A6E",
                    fontFamily: TOKENS.font.semibold,
                  }}
                >
                  {routeEtaLabel}
                </Text>
              ) : null}
              {routeEtaLabel && routeDistanceLabel ? (
                <Text className="text-[11px]" style={{ color: "#64748B" }}>
                  •
                </Text>
              ) : null}
              {routeDistanceLabel ? (
                <Text className="text-[11px]" style={{ color: "#334155" }}>
                  {routeDistanceLabel}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <Text className="text-[11px] mt-1" style={{ color: "#475569" }}>
          {routeStatus.message}
        </Text>

        {routeStatus.type !== "error" &&
        (routeEtaLabel || routeDistanceLabel) ? (
          <Text className="text-[10px] mt-1" style={{ color: "#64748B" }}>
            {routeStatus.type === "fallback"
              ? MAP_TEXT.navigationStatusBanner.fallbackInfo
              : MAP_TEXT.navigationStatusBanner.optimizedInfo}
          </Text>
        ) : null}

        {routeStatus.canRetry ? (
          <Pressable
            onPress={onRetry}
            disabled={isRouteFetching}
            className="mt-2 h-[30px] rounded-full items-center justify-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.82)",
              borderWidth: 1,
              borderColor: "rgba(15,23,42,0.12)",
              opacity: isRouteFetching ? 0.7 : 1,
            }}
          >
            <Text
              className="text-[11px] font-semibold"
              style={{ color: "#0F172A" }}
            >
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

export default NavigationStatusBanner;
