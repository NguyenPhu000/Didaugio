import { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { FILTER_GROUP_OPTIONS } from "../../constants/filter.constants";
import { cn } from "../../../../lib/cn";

const FilterGroupBar = memo(function FilterGroupBar({
  activeFilterGroup,
  onSelectFilterGroup,
  activeFilterGroupMeta,
  activeFilterSummaryLabel,
  onOpenFilterPicker,
}) {
  return (
    <View className="mt-3 px-4" pointerEvents="auto">
      <View className="flex-row items-center gap-2">
        <View className="flex-row items-center gap-2">
          <View
            className="flex-row items-center rounded-full border p-0.5"
            style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(0, 0, 0, 0.18)" }}
          >
            {FILTER_GROUP_OPTIONS.map((group) => {
              const active = activeFilterGroup === group.key;
              return (
                <Pressable
                  key={group.key}
                  onPress={() => onSelectFilterGroup(group.key)}
                  className={cn(
                    "h-[30px] flex-row items-center gap-1 rounded-[15px] border px-2.5",
                    active ? "border-ink bg-ink" : "border-[#D1D5DB] bg-white",
                  )}
                >
                  <MaterialIconsRounded
                    name={group.icon}
                    size={13}
                    color={active ? "#FFFFFF" : "#111111"}
                  />
                  <Text
                    className={cn(
                      "text-[11px] font-semibold",
                      active ? "text-white" : "text-ink",
                    )}
                  >
                    {group.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={onOpenFilterPicker}
            className="flex-1 flex-row items-center justify-between rounded-[17px] border px-3"
            style={{
              height: 34,
              backgroundColor: "#FFFFFF",
              borderColor: "rgba(0, 0, 0, 0.22)",
            }}
          >
            <View className="flex-1 flex-row items-center gap-1.5">
              <MaterialIconsRounded
                name={activeFilterGroupMeta.icon}
                size={14}
                color="#111111"
              />
              <Text
                numberOfLines={1}
                className="text-xs font-semibold"
                style={{ color: "#111111" }}
              >
                {activeFilterSummaryLabel}
              </Text>
            </View>
            <MaterialIconsRounded
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
