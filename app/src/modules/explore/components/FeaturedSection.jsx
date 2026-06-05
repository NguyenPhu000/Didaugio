import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
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
import { FeaturedCard, FEATURED_CARD_W } from "./FeaturedCard";

const ITEM_LENGTH = FEATURED_CARD_W + 14; // card + separator

const getItemLayout = (_, index) => ({
  length: ITEM_LENGTH,
  offset: ITEM_LENGTH * index,
  index,
});

const keyExtractor = (item, index) =>
  item?.id != null ? String(item.id) : `featured-${index}`;

function FeaturedSectionInner({ places, onPressPlace, onPressViewAll, onSavePlace, savedPlaceIds }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const dotCount = useMemo(() => Math.min(places?.length || 0, 4), [places]);

  const renderItem = useCallback(
    ({ item, index }) => {
      const handlePress = () => onPressPlace(item);
      const handleSave = () => onSavePlace?.(item);
      const isSaved = savedPlaceIds?.has?.(item?.id) || false;
      return (
        <FeaturedCard
          place={item}
          onPress={handlePress}
          onSave={handleSave}
          isSaved={isSaved}
          index={index}
        />
      );
    },
    [onPressPlace, onSavePlace, savedPlaceIds],
  );

  if (!places?.length) return null;

  return (
    <View className="mt-[26px]">
      <View style={{ paddingHorizontal: TAB_SCREEN_PADDING }} className="flex-row justify-between items-center mb-3.5">
        <Text className="text-[#1D1D1F] text-[22px] leading-7 tracking-[-0.5px] font-bold" style={{ fontFamily: TOKENS.font.heading }}>
          Điểm đến nổi bật
        </Text>
        {onPressViewAll ? (
          <Pressable onPress={onPressViewAll} hitSlop={8}>
            <Text className="text-[#0071E3] text-[13px] font-semibold px-3.5 h-8 rounded-full bg-[#0071E3]/[0.08] overflow-hidden text-center" style={{ fontFamily: TOKENS.font.semibold, lineHeight: 32 }}>
              Xem tất cả
            </Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={places}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_LENGTH}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        contentContainerStyle={{ paddingHorizontal: Math.max(0, TAB_SCREEN_PADDING - 6) }}
        ItemSeparatorComponent={Separator}
        onMomentumScrollEnd={(event) => {
          const x = event?.nativeEvent?.contentOffset?.x || 0;
          const nextIndex = Math.max(0, Math.round(x / ITEM_LENGTH));
          setActiveIndex(nextIndex);
        }}
      />

      {dotCount > 1 ? (
        <View style={{ paddingHorizontal: TAB_SCREEN_PADDING }} className="mt-3.5 flex-row items-center gap-1.5">
          {Array.from({ length: dotCount }).map((_, index) => {
            const active = index === activeIndex;
            return (
              <View
                key={`dot-${index}`}
                className={`h-1 rounded-full ${
                  active ? "w-7 bg-[#0071E3]" : "w-2 bg-black/10"
                }`}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function Separator() {
  return <View className="w-3.5" />;
}

export const FeaturedSection = memo(FeaturedSectionInner);
