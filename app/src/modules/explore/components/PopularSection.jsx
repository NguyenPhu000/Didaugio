import { memo, useCallback, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
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


  if (!places?.length) return null;

  return (
    <Animated.View style={[styles.container, sectionAnimStyle]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.list}>
        {places.map((item, index) => (
          <PopularCard
            key={item?.id != null ? String(item.id) : `popular-${index}`}
            place={item}
            onPress={() => onPressPlace(item)}
            index={index}
          />
        ))}
      </View>
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
