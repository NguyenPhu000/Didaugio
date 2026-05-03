import { memo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { getUserName } from "../utils/exploreHelpers";
import { NotificationBell } from "../../../components/composed/NotificationBell";

function ExploreHeaderInner({ user }) {
  const userName = getUserName(user);

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.avatarWrap}>
          <MaterialIcons name="person" size={20} color={APPLE_THEME.primary} />
        </View>

        <View style={styles.brandTextCol}>
          <Text style={styles.brandTopLabel}>Đi Đâu Giờ?</Text>
          <Text style={styles.brandGreeting} numberOfLines={1}>
            {`Xin chào, ${userName}`}
          </Text>
        </View>
      </View>

      <NotificationBell size={38} />
    </View>
  );
}

export const ExploreHeader = memo(ExploreHeaderInner);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: TOKENS.radius["3xl"],
    backgroundColor: APPLE_THEME.surface,
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
    ...Platform.select({
      ios: {
        ...TOKENS.shadow.sm,
      },
      android: { elevation: TOKENS.shadow.sm.elevation },
    }),
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.primaryTint,
  },
  brandTextCol: {
    flex: 1,
    minWidth: 0,
  },
  brandTopLabel: {
    color: APPLE_THEME.textMuted,
    fontSize: 11,
    lineHeight: 13,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  brandGreeting: {
    marginTop: 2,
    color: APPLE_THEME.text,
    fontSize: 17,
    lineHeight: 21,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.2,
  },
});
