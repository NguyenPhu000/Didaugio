import { memo, useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { PopularCard } from "./PopularCard";


function PopularSectionInner({ places, onPressPlace, title = "Phổ biến" }) {
  if (!places?.length) return null;

  return (
    <View style={{ paddingHorizontal: TAB_SCREEN_PADDING }} className="mt-7">
      <View className="flex-row justify-between items-center mb-3.5">
        <Text className="text-[#1D1D1F] text-[22px] leading-7 tracking-[-0.5px] font-bold" style={{ fontFamily: TOKENS.font.heading }}>{title}</Text>
      </View>

      <View className="gap-3">
        {places.map((item, index) => (
          <PopularCard
            key={item?.id != null ? String(item.id) : `popular-${index}`}
            place={item}
            onPress={() => onPressPlace(item)}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}

export const PopularSection = memo(PopularSectionInner);
