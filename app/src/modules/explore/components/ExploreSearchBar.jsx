import { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";

function ExploreSearchBarInner({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <MaterialIcons name="search" size={22} color={APPLE_THEME.text} />
      </View>
      <Text style={styles.placeholder}>{"Tìm kiếm địa điểm, món ăn..."}</Text>
      <View style={styles.filterBtn}>
        <MaterialIcons
          name="filter-list"
          size={20}
          color={APPLE_THEME.textSecondary}
        />
      </View>
    </Pressable>
  );
}

export const ExploreSearchBar = memo(ExploreSearchBarInner);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 54,
    paddingHorizontal: 14,
    borderRadius: TOKENS.radius["2xl"],
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
  pressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: APPLE_THEME.surfaceElevated,
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    flex: 1,
    color: APPLE_THEME.textMuted,
    fontSize: 14,
    fontFamily: TOKENS.font.medium,
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: APPLE_THEME.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
});
