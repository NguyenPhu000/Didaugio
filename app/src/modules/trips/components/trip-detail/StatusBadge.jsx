import { memo } from "react";
import { View, Text } from "react-native";
import {
  getBookingStatusMeta,
  shouldShowBookingBadge,
} from "../../utils/tripTheme";
export const StatusBadge = memo(function StatusBadge({ status, destState }) {
  if (!shouldShowBookingBadge(status, destState)) return null;

  const meta = getBookingStatusMeta(status);
  return (
    <View
      className="flex-row items-center gap-[5px] px-[10px] py-[4px] rounded-full"
      style={{ backgroundColor: meta.bg }}
    >
      <View
        className="w-[5px] h-[5px] rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      <Text
        className="text-[11px] font-semibold tracking-[-0.08px]"
        style={{ color: meta.color }}
      >
        {meta.label}
      </Text>
    </View>
  );
});
