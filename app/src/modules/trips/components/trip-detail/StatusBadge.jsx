import { memo } from "react";
import { View, Text } from "react-native";
import {
  getBookingStatusMeta,
  shouldShowBookingBadge,
} from "../../utils/tripTheme";
import s, { T } from "../../utils/tripDetailTokens";

export const StatusBadge = memo(function StatusBadge({ status, destState }) {
  if (!shouldShowBookingBadge(status, destState)) return null;

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
