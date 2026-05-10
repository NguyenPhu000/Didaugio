import { memo, useCallback, useRef } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = TOKENS.spring.snappy;

const PillItem = memo(function PillItem({
  categoryId,
  icon,
  isActive,
  label,
  onPressCategory,
}) {
  const scale = useSharedValue(1);
  const bgProgress = useSharedValue(isActive ? 1 : 0);

  // Animate background on active change
  if (isActive && bgProgress.value !== 1) {
    bgProgress.value = withSpring(1, SPRING_CONFIG);
  } else if (!isActive && bgProgress.value !== 0) {
    bgProgress.value = withSpring(0, SPRING_CONFIG);
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: isActive ? APPLE_THEME.primary : APPLE_THEME.surface,
    borderColor: isActive ? APPLE_THEME.primary : APPLE_THEME.border,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.94, SPRING_CONFIG);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPressCategory(categoryId);
  }, [categoryId, onPressCategory]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.pill,
        animatedStyle,
        isActive ? styles.pillActiveShadow : null,
      ]}
    >
      <MaterialIcons
        name={icon}
        size={17}
        color={isActive ? APPLE_THEME.white : APPLE_THEME.text}
      />
      <Text
        style={[styles.pillText, isActive ? styles.pillTextActive : null]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
});

const keyExtractor = (item) => item.key;

function CategoryPillsInner({
  categories,
  selectedCategory,
  onSelectCategory,
}) {
  const renderItem = useCallback(
    ({ item }) => (
      <PillItem
        categoryId={item.categoryId}
        icon={item.icon}
        isActive={
          item.categoryId === null
            ? selectedCategory === null
            : String(selectedCategory) === String(item.categoryId)
        }
        label={item.label}
        onPressCategory={onSelectCategory}
      />
    ),
    [selectedCategory, onSelectCategory],
  );

  return (
    <FlatList
      data={categories}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
    />
  );
}

function areCategoryPillsPropsEqual(prev, next) {
  if (prev.selectedCategory !== next.selectedCategory) return false;
  if (prev.onSelectCategory !== next.onSelectCategory) return false;
  if (prev.categories.length !== next.categories.length) return false;

  for (let i = 0; i < prev.categories.length; i += 1) {
    const prevCat = prev.categories[i];
    const nextCat = next.categories[i];
    if (
      prevCat.key !== nextCat.key ||
      prevCat.categoryId !== nextCat.categoryId ||
      prevCat.label !== nextCat.label ||
      prevCat.icon !== nextCat.icon
    ) {
      return false;
    }
  }

  return true;
}

export const CategoryPills = memo(
  CategoryPillsInner,
  areCategoryPillsPropsEqual,
);

const styles = StyleSheet.create({
  listContent: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillActiveShadow: {
    ...Platform.select({
      ios: {
        shadowColor: APPLE_THEME.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  pillText: {
    color: APPLE_THEME.text,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
  },
  pillTextActive: {
    color: APPLE_THEME.white,
  },
});
