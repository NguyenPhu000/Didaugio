import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { FeaturedCard, getFeaturedCardWidth } from "./FeaturedCard";
import { SectionHeading } from "./cinematic";
import { EXPLORE_THEME as C } from "./exploreTheme";

const CARD_GAP = 12;

function FeaturedSectionInner({
  places,
  onPressPlace,
  onSavePlace,
  savedPlaceIds,
  userLocation,
}) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const itemLength = getFeaturedCardWidth(width) + CARD_GAP;
  const count = places?.length || 0;
  const [activeIndex, setActiveIndex] = useState(0);

  const snapToOffsets = useMemo(
    () => Array.from({ length: count }, (_, index) => index * itemLength),
    [count, itemLength],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <FeaturedCard
        place={item}
        userLocation={userLocation}
        onPress={() => onPressPlace(item)}
        onSave={onSavePlace}
        isSaved={savedPlaceIds?.has?.(Number(item?.id)) || false}
      />
    ),
    [onPressPlace, onSavePlace, savedPlaceIds, userLocation],
  );

  if (!count) return null;

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <SectionHeading
          title={t("explore.sections.featured", "Điểm đến nổi bật")}
          right={
            count > 1 ? (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {Math.min(activeIndex + 1, count)} / {count}
                </Text>
              </View>
            ) : null
          }
        />
      </View>

      <FlatList
        data={places}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item?.id != null ? String(item.id) : `featured-${index}`
        }
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToOffsets={snapToOffsets}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: itemLength,
          offset: itemLength * index,
          index,
        })}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
        onMomentumScrollEnd={(event) =>
          setActiveIndex(
            Math.max(
              0,
              Math.round(
                (event?.nativeEvent?.contentOffset?.x || 0) / itemLength,
              ),
            ),
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 26,
  },
  heading: {
    paddingHorizontal: C.spacing,
    marginBottom: 14,
  },
  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 9999,
    borderCurve: "continuous",
    backgroundColor: C.sand,
  },
  countText: {
    fontFamily: C.font.semibold,
    fontSize: 11.5,
    color: C.ink,
    letterSpacing: -0.2,
  },
  list: {
    paddingHorizontal: C.spacing,
    paddingBottom: 2,
  },
});

export const FeaturedSection = memo(FeaturedSectionInner);

