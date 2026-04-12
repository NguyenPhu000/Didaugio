import { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../constants/design-tokens";
import { getUserName } from "../utils/exploreHelpers";

const TEXT_COLOR = "#191C1E";
const PRIMARY = "#101E2C";

function ExploreHeaderInner({ user }) {
  const userName = getUserName(user);

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.avatarWrap}>
          <MaterialIcons name="person" size={20} color={PRIMARY} />
        </View>

        <View style={styles.brandTextCol}>
          <Text style={styles.brandTopLabel}>Đi Đâu Giờ?</Text>
          <Text style={styles.brandGreeting} numberOfLines={1}>
            {`Xin chào, ${userName}`}
          </Text>
        </View>
      </View>

      <Pressable style={styles.iconButton}>
        <View style={styles.alertDot} />
        <MaterialIcons name="notifications-none" size={20} color={TEXT_COLOR} />
      </Pressable>
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
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(196,198,204,0.42)",
    ...Platform.select({
      ios: {
        shadowColor: "#191c1e",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
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
    backgroundColor: "rgba(16,30,44,0.12)",
  },
  brandTextCol: {
    flex: 1,
    minWidth: 0,
  },
  brandTopLabel: {
    color: "#3A4858",
    fontSize: 11,
    lineHeight: 13,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  brandGreeting: {
    marginTop: 2,
    color: TEXT_COLOR,
    fontSize: 17,
    lineHeight: 21,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(242,244,246,0.98)",
    borderWidth: 1,
    borderColor: "rgba(196,198,204,0.66)",
    position: "relative",
  },
  alertDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#3A81F5",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
});
