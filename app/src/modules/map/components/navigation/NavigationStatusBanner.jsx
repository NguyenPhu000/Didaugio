import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
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

  const isError = routeStatus.type === "error";

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-[14px] right-[14px] z-[72]"
      style={{ bottom: bottomOffset }}
    >
      <BlurView
        tint="dark"
        intensity={28}
        className="overflow-hidden rounded-[14px] border"
        style={{
          paddingHorizontal: 12,
          paddingVertical: 11,
          backgroundColor: isError
            ? "rgba(255,245,245,0.94)"
            : "rgba(255,255,255,0.94)",
          borderColor: isError
            ? "rgba(251,113,133,0.28)"
            : "rgba(15,23,42,0.08)",
        }}
      >
        <View className="flex-row items-center gap-2 justify-between">
          <View className="flex-1 flex-row items-center gap-2">
            <MaterialIconsRounded
              name={routeStatus.icon}
              size={16}
              color={isError ? "#E11D48" : "#0EA5E9"}
            />
            <Text
              className="text-xs font-semibold"
              style={{ color: "#0F172A" }}
            >
              {routeStatus.title}
            </Text>
          </View>

          {routeEtaLabel || routeDistanceLabel ? (
            <View
              className="flex-row items-center gap-1.5 rounded-[13px] border"
              style={{
                backgroundColor: "rgba(14, 165, 233, 0.1)",
                borderColor: "rgba(14, 165, 233, 0.2)",
                paddingHorizontal: 10,
                height: 26,
              }}
            >
              {routeEtaLabel ? (
                <Text
                  className="text-[11px] font-semibold"
                  style={{ color: "#0C4A6E", fontFamily: TOKENS.font.semibold }}
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

        <Text
          className="text-[11px] mt-1"
          style={{ color: "#475569" }}
        >
          {routeStatus.message}
        </Text>

        {routeStatus.type !== "error" &&
        (routeEtaLabel || routeDistanceLabel) ? (
          <Text
            className="text-[10px] mt-1"
            style={{ color: "#64748B" }}
          >
            {routeStatus.type === "fallback"
              ? MAP_TEXT.navigationStatusBanner.fallbackInfo
              : MAP_TEXT.navigationStatusBanner.optimizedInfo}
          </Text>
        ) : null}

        {routeStatus.canRetry ? (
          <Pressable
            onPress={onRetry}
            disabled={isRouteFetching}
            className="mt-2 h-[30px] items-center justify-center rounded-[15px] border"
            style={{
              opacity: isRouteFetching ? 0.7 : 1,
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              borderColor: "rgba(0, 0, 0, 0.1)",
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
