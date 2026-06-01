import { memo } from "react";
import { View, Text } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import {
  formatDistance,
  getTransportIcon,
  getTransportLabel,
} from "../../utils/tripHelpers";
import { ALPHA } from "../../utils/tripDetailTokens";

function TimelineConnector({ distanceToNext, transportToNext }) {
  if (!distanceToNext && !transportToNext) return null;

  const distanceText = distanceToNext ? formatDistance(distanceToNext) : null;
  const transportIcon = getTransportIcon(transportToNext);
  const friendlyTransport = getTransportLabel(transportToNext);
  const label = [distanceText, friendlyTransport].filter(Boolean).join(" · ");

  return (
    <View className="flex-row items-center pl-5 py-0.5 gap-[10px]">
      <View className="items-center gap-0">
        <View className="w-[1.5px] h-3 bg-black/[0.08]" />
        <View className="w-[4px] h-[4px] rounded-full bg-black/10 my-[2px]" />
        <View className="w-[1.5px] h-3 bg-black/[0.08]" />
      </View>
      {label ? (
        <View className="flex-row items-center gap-1 bg-black/[0.03] px-2.5 py-1 rounded-[8px]">
          {transportIcon ? (
            <MaterialIconsRounded name={transportIcon} size={12} color={ALPHA.iconMuted} />
          ) : null}
          <Text className="text-[11px] text-black/40 font-sans tracking-tight">{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default memo(TimelineConnector);
