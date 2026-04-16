import { memo, useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { FeaturedCard, FEATURED_CARD_W } from "./FeaturedCard";

const SNAP_INTERVAL = FEATURED_CARD_W + 14;

const keyExtractor = (item, index) =>
  item?.id != null ? String(item.id) : `featured-${index}`;

function FeaturedSectionInner({ places, onPressPlace, onPressViewAll }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const dotCount = useMemo(() => Math.min(places?.length || 0, 4), [places]);

  const renderItem = useCallback(
    ({ item }) => {
      const handlePress = () => onPressPlace(item);
      return <FeaturedCard place={item} onPress={handlePress} />;
    },
    [onPressPlace],
  );

  if (!places?.length) return null;

  return (
    <View style={styles.container}>
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
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={Separator}
        onMomentumScrollEnd={(event) => {
          const x = event?.nativeEvent?.contentOffset?.x || 0;
          const nextIndex = Math.max(0, Math.round(x / SNAP_INTERVAL));
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
    </View>
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
    color: APPLE_THEME.primary,
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 999,
    textAlignVertical: "center",
    backgroundColor: APPLE_THEME.surfaceElevated,
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
    overflow: "hidden",
  },
  listContent: {
    paddingHorizontal: Math.max(0, TAB_SCREEN_PADDING - 6),
  },
  separator: {
    width: 14,
  },
  progressWrap: {
    marginTop: 12,
    paddingHorizontal: TAB_SCREEN_PADDING,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  progressDotActive: {
    width: 32,
    backgroundColor: APPLE_THEME.primary,
  },
});
