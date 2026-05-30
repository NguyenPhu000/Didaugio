import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { FILTER_GROUP_OPTIONS } from "../../constants/filter.constants";

const FilterGroupBar = memo(function FilterGroupBar({
  activeFilterGroup,
  onSelectFilterGroup,
  activeFilterGroupMeta,
  activeFilterSummaryLabel,
  onOpenFilterPicker,
}) {
  return (
    <View style={styles.container} pointerEvents="auto">
      <View style={styles.row}>
        <View style={styles.row}>
          <View style={styles.pillContainer}>
            {FILTER_GROUP_OPTIONS.map((group) => {
              const active = activeFilterGroup === group.key;
              return (
                <Pressable
                  key={group.key}
                  onPress={() => onSelectFilterGroup(group.key)}
                  style={[
                    styles.pillItem,
                    active ? styles.pillItemActive : styles.pillItemInactive,
                  ]}
                >
                  <MaterialIcons
                    name={group.icon}
                    size={13}
                    color={active ? "#FFFFFF" : "#111111"}
                  />
                  <Text
                    style={[
                      styles.pillText,
                      active ? styles.pillTextActive : styles.pillTextInactive,
                    ]}
                  >
                    {group.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={onOpenFilterPicker}
            style={styles.dropdownTrigger}
          >
            <View style={styles.dropdownTriggerLeft}>
              <MaterialIcons
                name={activeFilterGroupMeta.icon}
                size={14}
                color="#111111"
              />
              <Text
                numberOfLines={1}
                style={styles.dropdownTriggerText}
              >
                {activeFilterSummaryLabel}
              </Text>
            </View>
            <MaterialIcons
              name="keyboard-arrow-down"
              size={18}
              color="#111111"
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pillContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 9999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.18)",
    padding: 2,
  },
  pillItem: {
    height: 30,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  pillItemActive: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },
  pillItemInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  pillTextActive: {
    color: "#FFFFFF",
  },
  pillTextInactive: {
    color: "#111111",
  },
  dropdownTrigger: {
    flex: 1,
    height: 34,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "between",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.22)",
  },
  dropdownTriggerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dropdownTriggerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111111",
  },
});

export default FilterGroupBar;
