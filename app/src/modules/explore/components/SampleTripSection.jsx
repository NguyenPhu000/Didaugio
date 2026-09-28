import { memo, useCallback } from "react";
import { FlatList, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { SampleTripCard, SAMPLE_TRIP_CARD_W } from "./SampleTripCard";
import { SectionHeading } from "./cinematic";
import { EXPLORE_THEME as C } from "./exploreTheme";

const keyExtractor = (item, index) =>
  item?.id != null ? String(item.id) : `sample-trip-${index}`;

function SampleTripSectionInner({ sampleTrips, onPressTrip, onPressViewAll }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const itemLength = Math.min(SAMPLE_TRIP_CARD_W, width - TAB_SCREEN_PADDING * 2) + 14;

  const renderItem = useCallback(
    ({ item }) => {
      const handlePress = () => onPressTrip?.(item);
      return <SampleTripCard trip={item} onPress={handlePress} />;
    },
    [onPressTrip],
  );

  if (!sampleTrips?.length) return null;

  return (
    <View style={{ marginTop: 30 }}>
      <View
        style={{ paddingHorizontal: TAB_SCREEN_PADDING, marginBottom: 14 }}
      >
        <SectionHeading title={t("explore.sampleTrip.sectionTitle")} right={onPressViewAll ? (
          <Pressable
            onPress={onPressViewAll}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("explore.sampleTrip.viewAll")}
            style={{ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Text style={{ fontFamily: C.font.semibold, fontSize: 12, color: C.river }}>{t("common.viewAll")}</Text>
            <MaterialIconsRounded name="arrow-forward" size={15} color={C.river} />
          </Pressable>
        ) : null} />
      </View>

      {/* Horizontal Cards Carousel */}
      <FlatList
        data={sampleTrips}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemLength}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: itemLength, offset: itemLength * index, index })}
        contentContainerStyle={{
          paddingHorizontal: Math.max(0, TAB_SCREEN_PADDING),
        }}
        ItemSeparatorComponent={() => <View className="w-3.5" />}
      />
    </View>
  );
}

export const SampleTripSection = memo(SampleTripSectionInner);
