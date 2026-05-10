import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
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

function FeaturedSectionInner({ places, onPressPlace, onPressViewAll }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionOpacity = useSharedValue(0);
  const sectionY = useSharedValue(20);

  const dotCount = useMemo(() => Math.min(places?.length || 0, 4), [places]);

  // Section entrance animation
  useEffect(() => {
    sectionOpacity.value = withDelay(
      100,
      withTiming(1, { duration: 400 }),
    );
    sectionY.value = withDelay(
      100,
      withSpring(0, TOKENS.spring.entrance),
    );
  }, [sectionOpacity, sectionY]);

  const sectionAnimStyle = useAnimatedStyle(() => ({
    opacity: sectionOpacity.value,
    transform: [{ translateY: sectionY.value }],
  }));

  const renderItem = useCallback(
    ({ item, index }) => {
      const handlePress = () => onPressPlace(item);
      return <FeaturedCard place={item} onPress={handlePress} index={index} />;
    },
    [onPressPlace],
  );

  if (!places?.length) return null;

  return (
    <Animated.View style={[styles.container, sectionAnimStyle]}>
      <View style={styles.header}>
        <Text style={styles.title}>{"Điểm đến nổi bật"}</Text>
        {onPressViewAll ? (
          <Pressable onPress={onPressViewAll} hitSlop={8}>
            <Text style={styles.viewAll}>{"Xem tất cả"}</Text>
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
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={Separator}
        onMomentumScrollEnd={(event) => {
          const x = event?.nativeEvent?.contentOffset?.x || 0;
          const nextIndex = Math.max(0, Math.round(x / ITEM_LENGTH));
          setActiveIndex(nextIndex);
        }}
      />

      {dotCount > 1 ? (
        <View style={styles.progressWrap}>
          {Array.from({ length: dotCount }).map((_, index) => {
            const active = index === activeIndex;
            return (
              <View
                key={`dot-${index}`}
                style={[
                  styles.progressDot,
                  active ? styles.progressDotActive : null,
                ]}
              />
            );
          })}
        </View>
      ) : null}
    </Animated.View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

export const FeaturedSection = memo(FeaturedSectionInner);

const styles = StyleSheet.create({
  container: {
    marginTop: 26,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: TAB_SCREEN_PADDING,
    marginBottom: 14,
  },
  title: {
    color: APPLE_THEME.text,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.5,
    fontFamily: TOKENS.font.heading,
  },
  viewAll: {
    color: APPLE_THEME.focusBlue,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 999,
    textAlignVertical: "center",
    backgroundColor: "rgba(0,113,227,0.08)",
    overflow: "hidden",
  },
  listContent: {
    paddingHorizontal: Math.max(0, TAB_SCREEN_PADDING - 6),
  },
  separator: {
    width: 14,
  },
  progressWrap: {
    marginTop: 14,
    paddingHorizontal: TAB_SCREEN_PADDING,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  progressDotActive: {
    width: 28,
    backgroundColor: APPLE_THEME.focusBlue,
  },
});
