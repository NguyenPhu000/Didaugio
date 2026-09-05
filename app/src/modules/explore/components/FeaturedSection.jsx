import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, View, useWindowDimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
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

const SegmentBar = memo(function SegmentBar({ active }) {
  const width = useSharedValue(active ? 26 : 7);
  const opacity = useSharedValue(active ? 1 : 0.5);

  useEffect(() => {
    width.value = withTiming(active ? 26 : 7, {
      duration: 320,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
    opacity.value = withTiming(active ? 1 : 0.5, { duration: 220 });
  }, [active, width, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          height: 3,
          borderRadius: 999,
          backgroundColor: INK,
        },
        animatedStyle,
      ]}
    />
  );
});

function SegmentedIndicator({ count, activeIndex }) {
  const segments = useMemo(() => {
    if (count <= 1) return [];
    const visible = Math.min(count, 5);
    return Array.from({ length: visible }, (_, index) => ({
      key: `seg-${index}`,
      active: index === Math.min(activeIndex, visible - 1),
    }));
  }, [count, activeIndex]);

  if (segments.length <= 1) return null;

  return (
    <View
      style={{
        paddingHorizontal: TAB_SCREEN_PADDING,
        marginTop: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
      }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: segments.length, now: activeIndex + 1 }}
    >
      {segments.map((segment) => (
        <SegmentBar key={segment.key} active={segment.active} />
      ))}
    </View>
  );
}

function FeaturedSectionInner({
  places,
  onPressPlace,
  onSavePlace,
  savedPlaceIds,
}) {
  const { t } = useTranslation();
  const { width: SCREEN_W } = useWindowDimensions();
  const CARD_W = getFeaturedCardWidth(SCREEN_W);
  const ITEM_LENGTH = CARD_W + CARD_SEP;

  const [activeIndex, setActiveIndex] = useState(0);
  const count = places?.length || 0;

  const getItemLayout = useCallback(
    (_, index) => ({ length: ITEM_LENGTH, offset: ITEM_LENGTH * index, index }),
    [ITEM_LENGTH],
  );

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
    <View style={{ marginTop: 30 }}>
      <View style={{ paddingHorizontal: TAB_SCREEN_PADDING, marginBottom: 16 }}>
        <SectionHeading
          title={t("explore.sections.featured")}
          right={
            <View
              style={{
                height: 32,
                paddingHorizontal: 12,
                borderRadius: 16,
                backgroundColor: "rgba(11,11,12,0.04)",
                borderWidth: 1,
                borderColor: "rgba(11,11,12,0.08)",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#16A34A",
                }}
              />
              <Animated.Text
                style={{
                  color: INK,
                  fontSize: 12,
                  fontFamily: "System",
                  fontWeight: "600",
                  letterSpacing: -0.1,
                }}
              >
                {`${Math.min(activeIndex + 1, count)} / ${count}`}
              </Animated.Text>
            </View>
          }
        />
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

      <SegmentedIndicator count={count} activeIndex={activeIndex} />

      <View
        style={{
          paddingHorizontal: TAB_SCREEN_PADDING,
          marginTop: 10,
        }}
      >
        <View
          style={{
            height: 1,
            backgroundColor: "rgba(11,11,12,0.05)",
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
}

export const FeaturedSection = memo(FeaturedSectionInner);
