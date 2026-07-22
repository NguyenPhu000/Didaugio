import { memo, useCallback } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { SampleTripCard, SAMPLE_TRIP_CARD_W } from "./SampleTripCard";

const ITEM_LENGTH = SAMPLE_TRIP_CARD_W + 14;

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
    [onPressTrip],
  );

  if (!sampleTrips?.length) return null;

  return (
    <View className="mt-8">
      {/* Section Header */}
      <View
        style={{ paddingHorizontal: TAB_SCREEN_PADDING }}
        className="mb-3.5 flex-row items-end justify-between"
      >
        <View className="flex-1 space-y-0.5">
          <View className="flex-row items-center space-x-2">
            <Text className="text-2xl font-bold text-slate-900 tracking-tight">
              Lịch trình gợi ý
            </Text>
            <View className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300/60">
              <Text className="text-[10px] font-extrabold text-amber-800 uppercase">
                Hot
              </Text>
            </View>
          </View>
          <Text className="text-xs font-medium text-slate-500">
            Khám phá Cần Thơ trọn vẹn cùng các gợi ý tối ưu
          </Text>
        </View>

        {onPressViewAll ? (
          <Pressable
            onPress={onPressViewAll}
            hitSlop={8}
            className="flex-row items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 active:bg-slate-200"
          >
            <Text className="text-xs font-bold text-slate-800">Tất cả</Text>
            <MaterialIconsRounded name="arrow-forward" size={15} color="#1E293B" />
          </Pressable>
        ) : null}
      </View>

      {/* Horizontal Cards Carousel */}
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
          paddingHorizontal: Math.max(0, TAB_SCREEN_PADDING),
        }}
        ItemSeparatorComponent={() => <View className="w-3.5" />}
      />
    </View>
  );
}

export const SampleTripSection = memo(SampleTripSectionInner);
