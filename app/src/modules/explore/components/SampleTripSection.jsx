import { memo, useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { TOKENS } from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { SampleTripCard, SAMPLE_TRIP_CARD_W } from "./SampleTripCard";

const ITEM_LENGTH = SAMPLE_TRIP_CARD_W + 12;

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
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrow}>DÀNH CHO BẠN</Text>
          </View>
          <Text style={styles.title}>Chuyến đi mẫu</Text>
          <Text style={styles.subtitle}>
            Clone hành trình đẹp từ cộng đồng
          </Text>
        </View>
        {onPressViewAll ? (
          <Pressable onPress={onPressViewAll} hitSlop={8} style={styles.viewAll}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={sampleTrips}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_LENGTH}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
  },
  header: {
    paddingHorizontal: TAB_SCREEN_PADDING,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
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
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#007BFF",
  },
  eyebrow: {
    color: "rgba(24,24,25,0.42)",
    fontSize: 10,
    fontFamily: TOKENS.font.bold,
    letterSpacing: 1.2,
  },
  title: {
    color: "#181819",
    fontSize: 23,
    lineHeight: 28,
    fontFamily: TOKENS.font.heading,
    letterSpacing: -0.6,
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
    backgroundColor: "rgba(0,123,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllText: {
    color: "#007BFF",
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  listContent: {
    paddingHorizontal: Math.max(0, TAB_SCREEN_PADDING - 4),
    gap: 12,
  },
});

export const SampleTripSection = memo(SampleTripSectionInner);
