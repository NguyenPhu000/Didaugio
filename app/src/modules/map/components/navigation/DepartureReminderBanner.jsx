import { memo } from "react";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../../constants/design-tokens";

/**
 * Banner nhắc nhở di chuyển sang địa điểm tiếp theo (khi còn dưới 10 phút so với endTime của điểm cũ).
 * Thiết kế mờ kính với tone màu xanh dương dịu nhẹ (info / notification style) sang trọng.
 */
const DepartureReminderBanner = memo(function DepartureReminderBanner({
  visible,
  bottomOffset = 0,
  nextName,
  minutesLeft = 10,
}) {
  const { t } = useTranslation();

  if (!visible) return null;

  const resolvedNextName = nextName || t("map.departureReminderBanner.defaultNextName");

  return (
    <View
      pointerEvents="none"
      className="absolute left-[14px] right-[14px] z-[78]"
      style={{ bottom: bottomOffset }}
    >
      <BlurView
        tint="dark"
        intensity={36}
        className="flex-row items-center gap-3 overflow-hidden rounded-[18px] border"
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderColor: "rgba(10, 132, 255, 0.3)",
          backgroundColor: "rgba(10, 18, 30, 0.85)",
        }}
      >
        <View
          className="h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: "rgba(10, 132, 255, 0.15)" }}
        >
          <MaterialIconsRounded name="departure-board" size={20} color="#0A84FF" />
        </View>

        <View className="flex-1 gap-px">
          <Text
            className="text-[13px] font-semibold"
            style={{ color: "#0A84FF", fontFamily: TOKENS.font.semibold, letterSpacing: -0.1 }}
            numberOfLines={1}
          >
            {t("map.departureReminderBanner.title")}
          </Text>
          <Text
            className="text-sm leading-4"
            style={{ color: "rgba(255, 255, 255, 0.85)", fontFamily: TOKENS.font.medium }}
            numberOfLines={2}
          >
            {minutesLeft > 0
              ? t("map.departureReminderBanner.withMinutes", { minutes: minutesLeft, name: resolvedNextName })
              : t("map.departureReminderBanner.now", { name: resolvedNextName })}
          </Text>
        </View>
      </BlurView>
    </View>
  );
});

export default DepartureReminderBanner;
