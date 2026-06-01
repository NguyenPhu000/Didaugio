import { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";

function ExploreSearchBarInner({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 h-[54px] px-3.5 rounded-[18px] bg-white border border-black/[0.04] shadow-sm elevation-1 active:opacity-90"
    >
      <View className="w-[34px] h-[34px] rounded-full bg-[#FAFAFA] border border-black/[0.06] items-center justify-center">
        <MaterialIconsRounded name="search" size={22} color={APPLE_THEME.text} />
      </View>
      <Text className="flex-1 text-[#54647A] text-[14px] font-medium">{"Tìm kiếm địa điểm, món ăn..."}</Text>
      <View className="w-[34px] h-[34px] rounded-full bg-[#E5F1FF] items-center justify-center">
        <MaterialIconsRounded
          name="filter-list"
          size={20}
          color={APPLE_THEME.textSecondary}
        />
      </View>
    </Pressable>
  );
}

export const ExploreSearchBar = memo(ExploreSearchBarInner);
