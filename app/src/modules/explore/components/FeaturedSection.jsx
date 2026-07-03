import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { FeaturedCard } from "./FeaturedCard";

const PAD = 24;
const CARD_SEP = 14;

const keyExtractor = (item, index) =>
  item?.id != null ? String(item.id) : `featured-${index}`;

function SectionTitle({ title }) {
  return (
    <View className="flex-row items-center gap-2.5">
      <View
        className="w-1 h-6 rounded-full"
        style={{ backgroundColor: APPLE_THEME.focusBlue }}
      />
      <Text
        className="text-[22px] leading-7 tracking-[-0.5px] font-bold"
        style={{ color: APPLE_THEME.text, fontFamily: TOKENS.font.heading }}
      >
        {title}
      </Text>
    </View>
  );
}

function FeaturedSectionInner({ places, onPressPlace, onPressViewAll, onSavePlace, savedPlaceIds }) {
  const { t } = useTranslation();
  const { width: SCREEN_W } = useWindowDimensions();
  const CARD_W = Math.min(280, SCREEN_W - PAD * 2 - 16);
  const ITEM_LENGTH = CARD_W + CARD_SEP;
  const getItemLayout = (_, index) => ({
    length: ITEM_LENGTH,
    offset: ITEM_LENGTH * index,
    index,
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const dotCount = useMemo(() => Math.min(places?.length || 0, 4), [places]);

  const renderItem = useCallback(
    ({ item }) => {
      const handlePress = () => onPressPlace(item);
      const handleSave = () => onSavePlace?.(item);
      const isSaved = savedPlaceIds?.has?.(item?.id) || false;
      return (
        <FeaturedCard
          place={item}
          onPress={handlePress}
          onSave={handleSave}
          isSaved={isSaved}
        />
      );
    },
    [onPressPlace, onSavePlace, savedPlaceIds],
  );

  if (!places?.length) return null;

  return (
    <View className="mt-6">
      <View
        style={{
          paddingHorizontal: TAB_SCREEN_PADDING,
          paddingBottom: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: "rgba(0,0,0,0.06)",
        }}
        className="flex-row justify-between items-center mb-3.5"
      >
        <SectionTitle title={t("explore.sections.featured")} />
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
        <View
          style={{ paddingHorizontal: TAB_SCREEN_PADDING }}
          className="mt-3 flex-row items-center gap-1.5"
        >
          {Array.from({ length: dotCount }).map((_, index) => {
            const active = index === activeIndex;
            return (
              <View
                key={`dot-${index}`}
                className="h-1 rounded-full"
                style={{
                  width: active ? 28 : 8,
                  backgroundColor: active ? APPLE_THEME.focusBlue : APPLE_THEME.primaryTint,
                }}
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
