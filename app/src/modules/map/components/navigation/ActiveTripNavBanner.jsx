import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../../constants/design-tokens";

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

const ActiveTripNavBanner = memo(function ActiveTripNavBanner({
  visible,
  topOffset = 0,
  instruction,
  instructionIcon = "navigation",
  targetName,
  etaLabel,
  distanceLabel,
  isFetching,
  travelMode,
  onExit,
}) {
  if (!visible) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-[14px] right-[14px] z-[80]"
      style={{ top: topOffset }}
    >
      <BlurView
        tint="dark"
        intensity={36}
        className="flex-row items-center gap-3 overflow-hidden rounded-[18px] border"
        style={{
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderColor: "rgba(255,255,255,0.16)",
          backgroundColor: "rgba(16,32,24,0.82)",
        }}
      >
        <View
          className="h-11 w-11 items-center justify-center rounded-[14px]"
          style={{ backgroundColor: "hsl(145, 63%, 32%)" }}
        >
          <MaterialIconsRounded name={instructionIcon} size={26} color="#FFFFFF" />
        </View>

        <View className="flex-1 gap-0.5">
          <Text
            className="text-[15px] font-semibold"
            style={{ color: "#FFFFFF", fontFamily: TOKENS.font.semibold, letterSpacing: -0.2 }}
            numberOfLines={2}
          >
            {instruction || "Đang tính tuyến đường..."}
          </Text>
          <View className="flex-row items-center gap-2">
            {targetName ? (
              <Text
                className="shrink text-xs"
                style={{ color: "rgba(255,255,255,0.7)", fontFamily: TOKENS.font.medium }}
                numberOfLines={1}
              >
                Đến {targetName}
              </Text>
            ) : null}
            {travelMode ? (
              <MaterialIconsRounded name={getTravelModeIcon(travelMode)} size={14} color="#5DD39E" />
            ) : null}
            {etaLabel || distanceLabel ? (
              <Text
                className="text-xs font-semibold"
                style={{ color: "#5DD39E", fontFamily: TOKENS.font.semibold }}
              >
                {[distanceLabel, etaLabel].filter(Boolean).join(" • ")}
              </Text>
            ) : isFetching ? (
              <Text
                className="text-xs font-semibold"
                style={{ color: "#5DD39E", fontFamily: TOKENS.font.semibold }}
              >
                Đang cập nhật…
              </Text>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={onExit}
          hitSlop={10}
          className="h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.14)" }}
        >
          <MaterialIconsRounded name="close" size={18} color="#FFFFFF" />
        </Pressable>
      </BlurView>
    </View>
  );
});

export default ActiveTripNavBanner;
