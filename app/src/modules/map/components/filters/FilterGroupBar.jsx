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
    <View className="mt-3 px-4 gap-3" pointerEvents="auto">
      {/* 1. Dãy Chips phân loại */}
      <View className="flex-row items-center gap-2">
        {FILTER_GROUP_OPTIONS.map((group) => {
          const active = activeFilterGroup === group.key;
          return (
            <Pressable
              key={group.key}
              onPress={() => onSelectFilterGroup(group.key)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={group.label}
              className={cn(
                "h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-full border active:opacity-70",
                active
                  ? "border-slate-900 bg-slate-900"
                  : "border-slate-200 bg-white"
              )}
            >
              <MaterialIconsRounded
                name={group.icon}
                size={16}
                color={active ? "#FFFFFF" : "#475569"} // text-slate-600
              />
              <Text
                numberOfLines={1}
                className={cn(
                  "text-xs font-semibold",
                  active ? "text-white" : "text-slate-600"
                )}
              >
                {group.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 2. Nút bấm hiển thị chi tiết (Picker Button) */}
      <Pressable
        onPress={onOpenFilterPicker}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${activeFilterGroupMeta.label}: ${activeFilterSummaryLabel}`}
        className="min-h-[48px] flex-row items-center justify-between rounded-2xl border border-slate-100 bg-white shadow-sm active:opacity-70 px-3 py-2"
      >
        <View className="flex-1 flex-row items-center gap-3">
          {/* Icon Container bo tròn */}
          <View className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
            <MaterialIconsRounded
              name={activeFilterGroupMeta.icon}
              size={18}
              color="#0F172A" // text-slate-900
            />
          </View>
          
          {/* Khối Text */}
          <View className="flex-1 justify-center">
            <Text
              numberOfLines={1}
              className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"
            >
              {activeFilterGroupMeta.label}
            </Text>
            <Text
              numberOfLines={1}
              className="text-sm font-bold text-slate-900 leading-tight"
            >
              {activeFilterSummaryLabel}
            </Text>
          </View>
        </View>
        
        <MaterialIconsRounded
          name="keyboard-arrow-down"
          size={22}
          color="#0F172A"
        />
      </Pressable>
    </View>
  );
});

export default FilterGroupBar;