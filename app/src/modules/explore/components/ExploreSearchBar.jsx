import { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { TOKENS } from "../../../constants/design-tokens";

function ExploreSearchBarInner({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <MaterialIcons name="search" size={22} color="#101E2C" />
      </View>
      <Text style={styles.placeholder}>{"Tìm kiếm địa điểm, món ăn..."}</Text>
      <View style={styles.filterBtn}>
        <MaterialIcons name="filter-list" size={20} color="#3A4858" />
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
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#191c1e",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },
  pressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(242,244,246,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    flex: 1,
    color: "#54647A",
    fontSize: 14,
    fontFamily: TOKENS.font.medium,
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(16,30,44,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
});
