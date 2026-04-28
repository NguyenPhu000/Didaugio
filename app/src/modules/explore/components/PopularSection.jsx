import { memo, useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";
import { TAB_SCREEN_PADDING } from "../../../../app/(tabs)/tabTheme";
import { PopularCard } from "./PopularCard";

const EST_ITEM_SIZE = 116;

const keyExtractor = (item, index) =>
  item?.id != null ? String(item.id) : `popular-${index}`;

function PopularSectionInner({ places, onPressPlace, title = "Phổ biến" }) {
  const renderItem = useCallback(
    ({ item }) => (
      <PopularCard place={item} onPress={() => onPressPlace(item)} />
    ),
    [onPressPlace],
  );

  if (!places?.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <FlashList
        data={places}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={EST_ITEM_SIZE}
        scrollEnabled={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

export const PopularSection = memo(PopularSectionInner);

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    paddingHorizontal: TAB_SCREEN_PADDING,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    color: APPLE_THEME.text,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.5,
    fontFamily: TOKENS.font.heading,
  },
  list: {
    gap: 12,
  },
});
