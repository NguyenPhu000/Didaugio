import { memo } from "react";
import { View, Text } from "react-native";
import { getBookingStatusMeta } from "../../utils/tripDetailTokens";
import s, { T } from "../../utils/tripDetailTokens";

export const StatusBadge = memo(function StatusBadge({ status }) {
  const meta = getBookingStatusMeta(status);
  const isActive = status === "confirmed";
  return (
    <View style={[s.badge, { backgroundColor: meta.bg }]}>
      <View
        style={[
          s.badgeDot,
          { backgroundColor: isActive ? T.onPrimary : meta.color },
        ]}
      />
      <Text style={[s.badgeText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
});
