import { memo, useCallback, useEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { TOKENS } from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { EventCard, EVENT_CARD_W } from "./EventCard";

const ITEM_LENGTH = EVENT_CARD_W + 14;

/** Live dot: pulse halo vô hạn, tạo cảm giác "đang phát trực tiếp". */
const PulseDot = memo(function PulseDot({ color = "#EF4444" }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(2.4, { duration: 1400, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1400, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
  }, [scale, opacity]);

  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={{ width: 12, height: 12, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: 7,
            height: 7,
            borderRadius: 3.5,
            backgroundColor: color,
          },
          haloStyle,
        ]}
      />
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: color,
        }}
      />
    </View>
  );
});

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
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <View style={styles.eyebrowRow}>
            <PulseDot color="#EF4444" />
            <Text style={styles.eyebrow}>{t("explore.event.eyebrow")}</Text>
          </View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{t("explore.event.communityEvents")}</Text>
            <View style={styles.hotPill}>
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: "#FFFFFF",
                  opacity: 0.92,
                }}
              />
              <Text style={styles.hotText}>{t("explore.event.live")}</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>{t("explore.event.subtitle")}</Text>
        </View>

        {onPressViewAll ? (
          <Pressable
            onPress={onPressViewAll}
            hitSlop={8}
            style={styles.viewAll}
            accessibilityRole="button"
            accessibilityLabel={t("explore.event.viewAll")}
          >
            <Text style={styles.viewAllText}>{t("explore.event.viewAll")}</Text>
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
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={Separator}
      />
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
  },
  header: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    paddingBottom: 0,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 14,
  },
  titleBlock: {
    flex: 1,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#EF4444",
  },
  eyebrow: {
    color: "rgba(24,24,25,0.42)",
    fontSize: 12,
    fontFamily: TOKENS.font.bold,
    letterSpacing: 1.2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: "#181819",
    fontSize: 23,
    lineHeight: 28,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.6,
  },
  hotPill: {
    paddingHorizontal: 9,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
    elevation: 2,
  },
  hotText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontFamily: TOKENS.font.bold,
    letterSpacing: 0.6,
  },
  subtitle: {
    color: "rgba(24,24,25,0.48)",
    fontSize: 12,
    fontFamily: TOKENS.font.medium,
    marginTop: 1,
  },
  viewAll: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#181819",
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  listContent: {
    paddingHorizontal: Math.max(0, TAB_SCREEN_PADDING - 6),
  },
  separator: {
    width: 14,
  },
});

export const EventSection = memo(EventSectionInner);
