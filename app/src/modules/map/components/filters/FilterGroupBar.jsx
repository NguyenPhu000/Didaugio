import { memo } from "react";
import { Pressable, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";

const FilterGroupBar = memo(function FilterGroupBar({
  activeFilterGroupMeta,
  activeFilterSummaryLabel,
  onOpenFilterPicker,
}) {
  return (
    <View className="mt-3 px-4" pointerEvents="auto">
      <Pressable
        onPress={onOpenFilterPicker}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${activeFilterGroupMeta.label}: ${activeFilterSummaryLabel}`}
        className="h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/95 active:opacity-75"
        style={{
          borderCurve: "continuous",
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <MaterialIconsRounded name="filter-list" size={21} color="#0F172A" />
      </Pressable>
    </View>
  );
});

export default FilterGroupBar;
