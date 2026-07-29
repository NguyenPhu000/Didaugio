import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { FeaturedCard, getFeaturedCardWidth } from "./FeaturedCard";
import { INK, SectionHeading } from "./cinematic";

const CARD_SEP = 12;

const keyExtractor = (item, index) =>
  item?.id != null ? String(item.id) : `featured-${index}`;

function Separator() {
  return <View style={{ width: CARD_SEP }} />;
}

function FeaturedSectionInner({ places, onPressPlace, onSavePlace, savedPlaceIds }) {
  const { t } = useTranslation();
  const { width: SCREEN_W } = useWindowDimensions();
  const CARD_W = getFeaturedCardWidth(SCREEN_W);
  const ITEM_LENGTH = CARD_W + CARD_SEP;

  const [activeIndex, setActiveIndex] = useState(0);
  const count = places?.length || 0;
  const dotCount = useMemo(() => Math.min(count, 5), [count]);

  const getItemLayout = useCallback(
    (_, index) => ({ length: ITEM_LENGTH, offset: ITEM_LENGTH * index, index }),
    [ITEM_LENGTH],
  );

  /** Snap tuyệt đối, bù phần padding đầu của contentContainer. */
  const snapToOffsets = useMemo(
    () => Array.from({ length: count }, (_, index) => index * ITEM_LENGTH),
    [count, ITEM_LENGTH],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <FeaturedCard
        place={item}
        onPress={() => onPressPlace(item)}
        onSave={onSavePlace}
        isSaved={savedPlaceIds?.has?.(item?.id) || false}
      />
    ),
    [onPressPlace, onSavePlace, savedPlaceIds],
  );

  const handleMomentumEnd = useCallback(
    (event) => {
      const x = event?.nativeEvent?.contentOffset?.x || 0;
      setActiveIndex(Math.max(0, Math.round(x / ITEM_LENGTH)));
    },
    [ITEM_LENGTH],
  );

  if (!count) return null;

  return (
    <View style={{ marginTop: 26 }}>
      <View style={{ paddingHorizontal: TAB_SCREEN_PADDING, marginBottom: 14 }}>
        <SectionHeading title={t("explore.sections.featured")} />
      </View>

      <FlatList
        data={places}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToOffsets={snapToOffsets}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        contentContainerStyle={{
          paddingHorizontal: TAB_SCREEN_PADDING,
          paddingVertical: 4,
        }}
        ItemSeparatorComponent={Separator}
        onMomentumScrollEnd={handleMomentumEnd}
      />

      {dotCount > 1 ? (
        <View
          style={{
            paddingHorizontal: TAB_SCREEN_PADDING,
            marginTop: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
          }}
        >
          {Array.from({ length: dotCount }).map((_, index) => {
            const active = index === Math.min(activeIndex, dotCount - 1);
            return (
              <View
                key={`featured-dot-${index}`}
                style={{
                  height: 3,
                  width: active ? 26 : 7,
                  borderRadius: 999,
                  backgroundColor: active ? INK : "rgba(11,11,12,0.16)",
                }}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export const FeaturedSection = memo(FeaturedSectionInner);
