import { memo, useCallback } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { TOKENS } from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { SampleTripCard, SAMPLE_TRIP_CARD_W } from "./SampleTripCard";

const ITEM_LENGTH = SAMPLE_TRIP_CARD_W + 12;

const getItemLayout = (_, index) => ({
  length: ITEM_LENGTH,
  offset: ITEM_LENGTH * index,
  index,
});

const keyExtractor = (item, index) =>
  item?.id != null ? String(item.id) : `sample-trip-${index}`;

function SampleTripSectionInner({ sampleTrips, onPressTrip, onPressViewAll }) {
  const renderItem = useCallback(
    ({ item }) => {
      const handlePress = () => onPressTrip?.(item);
      return <SampleTripCard trip={item} onPress={handlePress} />;
    },
    [onPressTrip]
  );

  // Empty state — ẩn toàn bộ section kể cả header
  if (!sampleTrips?.length) return null;

  return (
    <View className="mt-[26px]">
      {/* Header */}
      <View
        style={{ paddingHorizontal: TAB_SCREEN_PADDING }}
        className="flex-row justify-between items-center mb-3.5"
      >
        <View>
          <Text
            className="text-ink text-[22px] leading-7 tracking-[-0.5px] font-bold"
            style={{ fontFamily: TOKENS.font.heading }}
          >
            Lich trinh mau
          </Text>
          <Text
            className="text-black/48 text-[12px] mt-0.5"
            style={{ fontFamily: TOKENS.font.medium }}
          >
            Kham pha {sampleTrips.length} chuyen di duoc de xuat
          </Text>
        </View>
        {onPressViewAll ? (
          <Pressable onPress={onPressViewAll} hitSlop={8}>
            <Text
              className="text-primary text-[13px] font-semibold px-3.5 h-8 rounded-full bg-primary/[0.08] overflow-hidden text-center"
              style={{ fontFamily: TOKENS.font.semibold, lineHeight: 32 }}
            >
              Xem tat ca
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Horizontal list */}
      <FlatList
        data={sampleTrips}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_LENGTH}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        contentContainerStyle={{
          paddingHorizontal: Math.max(0, TAB_SCREEN_PADDING - 4),
          gap: 12,
        }}
      />
    </View>
  );
}

export const SampleTripSection = memo(SampleTripSectionInner);
