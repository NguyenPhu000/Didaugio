import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { MaterialIconsRounded } from "../../../../components/primitives/MaterialIconsRounded";
import { TOKENS } from "../../../../constants/design-tokens";
import { formatRouteDistance } from "../../utils/routeFormat";

const ARRIVAL_UNLOCK_DISTANCE_M = 30;

const ArrivalBanner = memo(function ArrivalBanner({
  visible,
  targetName,
  distanceMeters,
  speedKmh = 0,
  bottomOffset = 0,
  onDismiss,
  onConfirm,
}) {
  if (!visible) return null;

  const canConfirm =
    Number(distanceMeters) <= ARRIVAL_UNLOCK_DISTANCE_M && Number(speedKmh) < 5;
  const distanceLabel = formatRouteDistance(distanceMeters);

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-[14px] right-[14px] z-[90]"
      style={{ bottom: bottomOffset }}
    >
      <BlurView
        tint="light"
        intensity={46}
        className="overflow-hidden rounded-[22px] border border-white/70 bg-white/90 px-4 py-3"
      >
        <View className="flex-row items-start gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600">
            <MaterialIconsRounded name="flag" size={24} color="#FFFFFF" />
          </View>

          <View className="flex-1">
            <Text
              className="text-[15px] font-bold text-slate-950"
              style={{ fontFamily: TOKENS.font.bold }}
            >
              {canConfirm ? "Bạn đã đến nơi?" : "Sắp đến nơi"}
            </Text>
            <Text
              className="mt-1 text-xs leading-[18px] text-slate-600"
              style={{ fontFamily: TOKENS.font.medium }}
            >
              {canConfirm
                ? `Xác nhận đã tới ${targetName || "điểm đến"} để hoàn tất chặng.`
                : `Còn ${distanceLabel || "một đoạn ngắn"} đến ${targetName || "điểm đến"}. Tìm chỗ dừng xe an toàn.`}
            </Text>
          </View>

          <Pressable
            onPress={onDismiss}
            hitSlop={10}
            className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
          >
            <MaterialIconsRounded name="close" size={17} color="#475569" />
          </Pressable>
        </View>

        <Pressable
          disabled={!canConfirm}
          onPress={onConfirm}
          className={`mt-3 h-11 items-center justify-center rounded-full ${
            canConfirm ? "bg-emerald-600" : "bg-slate-200"
          }`}
        >
          <Text
            className={`text-sm font-bold ${
              canConfirm ? "text-white" : "text-slate-500"
            }`}
            style={{ fontFamily: TOKENS.font.bold }}
          >
            {canConfirm ? "Vuốt/nhấn để xác nhận" : "Mở khóa khi dừng trong 30m"}
          </Text>
        </Pressable>
      </BlurView>
    </View>
  );
});

export default ArrivalBanner;
