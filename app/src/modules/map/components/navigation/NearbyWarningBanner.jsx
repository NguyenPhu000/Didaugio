import { memo } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../../constants/design-tokens";

/**
 * Banner cảnh báo sắp đến địa điểm (khoảng cách <= 150m) sử dụng thuật toán Hysteresis.
 * Thiết kế mờ kính với tông màu hổ phách/vàng nhẹ (amber/gold) cao cấp.
 */
const NearbyWarningBanner = memo(function NearbyWarningBanner({
  visible,
  topOffset = 0,
  targetName,
  distanceMeters = 0,
}) {
  const { t } = useTranslation();

  if (!visible) return null;

  const displayDistance = Math.round(distanceMeters);
  const resolvedTargetName = targetName || t("map.nearbyWarningBanner.defaultTarget");

  return (
    <View
      pointerEvents="none"
      className="absolute left-[14px] right-[14px] z-[79]"
      style={{ top: topOffset }}
    >
      <BlurView
        tint="dark"
        intensity={36}
        className="flex-row items-center gap-3 overflow-hidden rounded-[18px] border"
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderColor: "rgba(255, 214, 10, 0.3)",
          backgroundColor: "rgba(30, 26, 10, 0.85)",
        }}
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: "rgba(255, 214, 10, 0.15)" }}
        >
          <MaterialIconsRounded name="near-me" size={20} color="#FFD60A" />
        </View>

        <View className="flex-1 gap-px">
          <Text
            className="text-[13px] font-semibold"
            style={{ color: "#FFD60A", fontFamily: TOKENS.font.semibold, letterSpacing: -0.1 }}
            numberOfLines={1}
          >
            {t("map.nearbyWarningBanner.title")}
          </Text>
          <Text
            className="text-sm leading-4"
            style={{ color: "rgba(255, 255, 255, 0.85)", fontFamily: TOKENS.font.medium }}
            numberOfLines={2}
          >
            {t("map.nearbyWarningBanner.message", { distance: displayDistance, name: resolvedTargetName })}
          </Text>
        </View>
      </BlurView>
    </View>
  );
});

export default NearbyWarningBanner;
