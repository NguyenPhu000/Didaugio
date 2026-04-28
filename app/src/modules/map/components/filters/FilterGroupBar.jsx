import { memo } from "react";
import { Pressable, Text, View } from "react-native";
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
    <View className="mt-3 px-4" pointerEvents="auto">
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <View className="flex-row items-center gap-2">
          <View
            className="flex-row items-center"
            style={{
              borderRadius: 999,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "rgba(15,23,42,0.18)",
              padding: 2,
            }}
          >
            {FILTER_GROUP_OPTIONS.map((group) => {
              const active = activeFilterGroup === group.key;
              return (
                <Pressable
                  key={group.key}
                  onPress={() => onSelectFilterGroup(group.key)}
                  className="h-[30px] rounded-full flex-row items-center gap-1 px-2.5"
                  style={{
                    backgroundColor: active ? "#111111" : "#FFFFFF",
                    borderWidth: 1,
                    borderColor: active ? "#111111" : "#D1D5DB",
                  }}
                >
                  <MaterialIcons
                    name={group.icon}
                    size={13}
                    color={active ? "#FFFFFF" : "#111111"}
                  />
                  <Text
                    className="text-[11px] font-semibold"
                    style={{ color: active ? "#FFFFFF" : "#111111" }}
                  >
                    {group.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={onOpenFilterPicker}
            className="flex-1 h-[34px] rounded-full flex-row items-center justify-between px-3"
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "rgba(15,23,42,0.22)",
            }}
          >
            <View className="flex-row items-center gap-1.5" style={{ flex: 1 }}>
              <MaterialIcons
                name={activeFilterGroupMeta.icon}
                size={14}
                color="#111111"
              />
              <Text
                numberOfLines={1}
                className="text-[12px] font-semibold"
                style={{ color: "#111111" }}
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

export default FilterGroupBar;
