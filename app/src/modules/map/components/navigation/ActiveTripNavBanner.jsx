import { memo, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { MaterialIconsRounded } from "../../../../components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../../constants/design-tokens";
import { formatRouteDistance } from "../../utils/routeFormat";

const APPROACHING_THRESHOLD_M = 300;

/**
 * Banner dẫn đường turn-by-turn cho Active Trip Mode.
 * Hiển thị hướng dẫn rẽ kế tiếp + ETA/khoảng cách + nút thoát hành trình.
 */
const getTravelModeIcon = (mode) => {
  switch (mode) {
    case "walking":
      return "directions-walk";
    case "driving":
      return "directions-car";
    case "cycling":
      return "directions-bike";
    case "bus":
      return "directions-bus";
    default:
      return "motorcycle";
  }
};

const getBannerTone = (distanceMeters, isOffRoute) => {
  if (isOffRoute) {
    return {
      background: "rgba(127,29,29,0.88)",
      accent: "#FCA5A5",
      iconBg: "#DC2626",
    };
  }
  if (Number(distanceMeters) < 30) {
    return {
      background: "rgba(127,29,29,0.86)",
      accent: "#FCA5A5",
      iconBg: "#EF4444",
    };
  }
  if (Number(distanceMeters) < 100) {
    return {
      background: "rgba(124,45,18,0.86)",
      accent: "#FDBA74",
      iconBg: "#F97316",
    };
  }
  return {
    background: "rgba(16,32,24,0.84)",
    accent: "#5DD39E",
    iconBg: "hsl(145, 63%, 32%)",
  };
};

const ActiveTripNavBanner = memo(function ActiveTripNavBanner({
  visible,
  topOffset = 0,
  instruction,
  instructionIcon = "navigation",
  targetName,
  etaLabel,
  distanceLabel,
  distanceToNextTurn,
  distanceToNextTurnLabel,
  streetName,
  isFetching,
  isOffRoute = false,
  isVoiceMuted = false,
  travelMode,
  onToggleVoice,
  onExit,
}) {
  const pulseScale = useSharedValue(1);
  const isApproaching =
    Number(distanceToNextTurn) > 0 &&
    Number(distanceToNextTurn) < APPROACHING_THRESHOLD_M;

  useEffect(() => {
    if (isApproaching) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withTiming(1, { duration: 200 });
    }
    return () => cancelAnimation(pulseScale);
  }, [isApproaching, pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!visible) return null;

  const mainDistanceLabel =
    distanceToNextTurnLabel ||
    formatRouteDistance(distanceToNextTurn) ||
    distanceLabel ||
    "Đang đi";
  const tone = getBannerTone(distanceToNextTurn, isOffRoute);
  const subtitle = isOffRoute
    ? "Đang tính lại tuyến phù hợp"
    : streetName || targetName
      ? `Tiếp tục đến ${streetName || targetName}`
      : "Bám theo tuyến đường hiện tại";

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-[14px] right-[14px] z-[80]"
      style={{ top: topOffset }}
    >
      <BlurView
        tint="dark"
        intensity={42}
        className="overflow-hidden rounded-[22px] border"
        style={{
          borderColor: "rgba(255,255,255,0.16)",
          backgroundColor: tone.background,
        }}
      >
        <View className="flex-row items-center gap-3 px-4 py-3">
          <Animated.View
            className="h-16 w-16 items-center justify-center rounded-[22px]"
            style={[{ backgroundColor: tone.iconBg }, pulseStyle]}
          >
            <MaterialIconsRounded name={instructionIcon} size={40} color="#FFFFFF" />
          </Animated.View>

          <View className="flex-1">
            <Text
              className="text-[28px] font-bold leading-[32px] text-white"
              style={{ fontFamily: TOKENS.font.bold, letterSpacing: -0.6 }}
              numberOfLines={1}
            >
              {mainDistanceLabel}
            </Text>
            <Text
              className="mt-1 text-[15px] font-semibold leading-5 text-white"
              style={{ fontFamily: TOKENS.font.semibold, letterSpacing: -0.2 }}
              numberOfLines={2}
            >
              {instruction || "Đang tính tuyến đường..."}
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              {travelMode ? (
                <MaterialIconsRounded
                  name={getTravelModeIcon(travelMode)}
                  size={14}
                  color={tone.accent}
                />
              ) : null}
              <Text
                className="shrink text-xs font-semibold"
                style={{ color: tone.accent, fontFamily: TOKENS.font.semibold }}
                numberOfLines={1}
              >
                {isFetching
                  ? "Đang cập nhật..."
                  : [subtitle, etaLabel].filter(Boolean).join(" • ")}
              </Text>
            </View>
          </View>

          {onToggleVoice ? (
            <Pressable
              onPress={onToggleVoice}
              hitSlop={10}
              className="h-9 w-9 items-center justify-center rounded-full bg-white/15"
            >
              <MaterialIconsRounded
                name={isVoiceMuted ? "volume-off" : "volume-up"}
                size={19}
                color="#FFFFFF"
              />
            </Pressable>
          ) : null}

          <Pressable
            onPress={onExit}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-white/15"
          >
            <MaterialIconsRounded name="close" size={19} color="#FFFFFF" />
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
});

export default ActiveTripNavBanner;
