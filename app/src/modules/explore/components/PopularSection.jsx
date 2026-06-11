import { memo, useCallback } from "react";
import { Text, View } from "react-native";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { PopularCard } from "./PopularCard";

function PopularCardWrapper({ place, onPressPlace }) {
  const handlePress = useCallback(() => {
    onPressPlace(place);
  }, [place, onPressPlace]);

  return <PopularCard place={place} onPress={handlePress} />;
}

function PopularSectionInner({ places, onPressPlace, title }) {
  if (!places?.length) return null;

  return (
    <View style={{ paddingHorizontal: TAB_SCREEN_PADDING }} className="mt-7">
      <View className="flex-row items-center gap-2.5 mb-3.5">
        <View
          className="w-1 h-6 rounded-full"
          style={{ backgroundColor: APPLE_THEME.focusBlue }}
        />
        <Text
          className="text-[22px] leading-7 tracking-[-0.5px] font-bold flex-1"
          style={{ color: APPLE_THEME.text, fontFamily: TOKENS.font.heading }}
          numberOfLines={2}
        >
          {title}
        </Text>
      </View>

      <View className="gap-3">
        {places.map((item, index) => (
          <PopularCardWrapper
            key={item?.id != null ? String(item.id) : `popular-${index}`}
            place={item}
            onPressPlace={onPressPlace}
          />
        ))}
      </View>
    </View>
  );
}

export const PopularSection = memo(PopularSectionInner);
