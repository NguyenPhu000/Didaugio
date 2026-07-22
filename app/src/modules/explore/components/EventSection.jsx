import { memo, useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { TOKENS } from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { EventCard, EVENT_CARD_W } from "./EventCard";

const ITEM_LENGTH = EVENT_CARD_W + 14;

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
            <View style={styles.liveDot} />
            <Text style={styles.eyebrow}>CỘNG ĐỒNG</Text>
          </View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{t("explore.event.communityEvents")}</Text>
            <View style={styles.hotPill}>
              <Text style={styles.hotText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>Tham gia, check-in và đi cùng mọi người</Text>
        </View>

        {onPressViewAll ? (
          <Pressable onPress={onPressViewAll} hitSlop={8} style={styles.viewAll}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
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
    backgroundColor: "#181819",
  },
  eyebrow: {
    color: "rgba(24,24,25,0.42)",
    fontSize: 10,
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
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#181819",
    alignItems: "center",
    justifyContent: "center",
  },
  hotText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: TOKENS.font.bold,
    letterSpacing: 0.8,
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
