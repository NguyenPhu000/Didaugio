import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { FlatList, StyleSheet, View, useWindowDimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { FeaturedCard, getFeaturedCardWidth } from "./FeaturedCard";
import { SectionHeading } from "./cinematic";
import { EXPLORE_THEME as C } from "./exploreTheme";

const SLIDE_GAP = 12;
const SLIDE_INTERVAL_MS = 5000;

function FeaturedSectionInner({ places, onPressPlace }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const listRef = useRef(null);
  const slideIndexRef = useRef(0);
  const pauseUntilRef = useRef(0);
  const itemLength = getFeaturedCardWidth(width) + SLIDE_GAP;
  const count = places?.length || 0;
  const offsets = useMemo(
    () => Array.from({ length: count }, (_, index) => index * itemLength),
    [count, itemLength],
  );

  useEffect(() => {
    slideIndexRef.current = 0;
    if (count < 2) return undefined;

    const timer = setInterval(() => {
      if (Date.now() < pauseUntilRef.current) return;
      slideIndexRef.current = (slideIndexRef.current + 1) % count;
      listRef.current?.scrollToOffset({
        offset: offsets[slideIndexRef.current],
        animated: true,
      });
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [count, offsets]);

  const handleScrollBeginDrag = useCallback(() => {
    pauseUntilRef.current = Date.now() + SLIDE_INTERVAL_MS * 2;
  }, []);

  const handleMomentumEnd = useCallback((event) => {
    const offset = event.nativeEvent.contentOffset.x;
    slideIndexRef.current = Math.max(
      0,
      Math.min(count - 1, Math.round(offset / itemLength)),
    );
  }, [count, itemLength]);

  const renderItem = useCallback(({ item }) => (
    <FeaturedCard
      place={item}
      onPress={() => onPressPlace(item)}
    />
  ), [onPressPlace]);

  if (!count) return null;

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <SectionHeading title={t("explore.sections.featured", "Điểm đến nổi bật")} />
      </View>
      <FlatList
        ref={listRef}
        data={places}
        renderItem={renderItem}
        keyExtractor={(item, index) => item?.id != null ? String(item.id) : `featured-${index}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToOffsets={offsets}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: itemLength, offset: itemLength * index, index })}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: SLIDE_GAP }} />}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleMomentumEnd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 26 },
  heading: { paddingHorizontal: C.spacing, marginBottom: 14 },
  list: { paddingHorizontal: C.spacing, paddingBottom: 2 },
});

export const FeaturedSection = memo(FeaturedSectionInner);
