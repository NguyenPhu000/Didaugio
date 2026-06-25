import { memo, useCallback } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { EventCard, EVENT_CARD_W } from "./EventCard";

const ITEM_LENGTH = EVENT_CARD_W + 14; // card + separator

const getItemLayout = (_, index) => ({
  length: ITEM_LENGTH,
  offset: ITEM_LENGTH * index,
  index,
});

const keyExtractor = (item, index) =>
  item?.id != null ? String(item.id) : `event-${index}`;

function EventSectionInner({ events, onPressEvent, onPressViewAll }) {
  const { t } = useTranslation();

  const renderItem = useCallback(
    ({ item }) => {
      const handlePress = () => onPressEvent(item);
      return <EventCard event={item} onPress={handlePress} />;
    },
    [onPressEvent],
  );

  if (!events?.length) return null;

  return (
    <View className="mt-[26px]">
      <View style={{ paddingHorizontal: TAB_SCREEN_PADDING }} className="flex-row justify-between items-center mb-3.5">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-ink text-[22px] leading-7 tracking-[-0.5px] font-bold" style={{ fontFamily: TOKENS.font.heading }}>
            {t("explore.event.communityEvents")}
          </Text>
          <View className="px-2 py-0.5 rounded-full bg-red-100 items-center justify-center">
            <Text className="text-red-600 text-[10px] font-bold" style={{ fontFamily: TOKENS.font.bold }}>HOT</Text>
          </View>
        </View>
        {onPressViewAll ? (
          <Pressable onPress={onPressViewAll} hitSlop={8}>
            <Text className="text-primary text-[13px] font-semibold px-3.5 h-8 rounded-full bg-primary/[0.08] overflow-hidden text-center" style={{ fontFamily: TOKENS.font.semibold, lineHeight: 32 }}>
              {t("explore.event.viewAll")}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_LENGTH}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        contentContainerStyle={{ paddingHorizontal: Math.max(0, TAB_SCREEN_PADDING - 6) }}
        ItemSeparatorComponent={Separator}
      />
    </View>
  );
}

function Separator() {
  return <View className="w-3.5" />;
}

export const EventSection = memo(EventSectionInner);
