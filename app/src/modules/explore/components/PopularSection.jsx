import { memo, useCallback, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
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
import { PopularCard } from "./PopularCard";

const EST_ITEM_SIZE = 140;

const keyExtractor = (item, index) =>
  item?.id != null ? String(item.id) : `popular-${index}`;

function PopularSectionInner({ places, onPressPlace, title = "Phổ biến" }) {
  const sectionOpacity = useSharedValue(0);
  const sectionY = useSharedValue(20);

  // Section entrance animation
  useEffect(() => {
    sectionOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 400 }),
    );
    sectionY.value = withDelay(
      200,
      withSpring(0, TOKENS.spring.entrance),
    );
  }, [sectionOpacity, sectionY]);

  const sectionAnimStyle = useAnimatedStyle(() => ({
    opacity: sectionOpacity.value,
    transform: [{ translateY: sectionY.value }],
  }));

  const renderItem = useCallback(
    ({ item, index }) => (
      <PopularCard place={item} onPress={() => onPressPlace(item)} index={index} />
    ),
    [onPressPlace],
  );

  if (!places?.length) return null;

  return (
    <Animated.View style={[styles.container, sectionAnimStyle]}>
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
    </Animated.View>
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
