import { memo, useCallback } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  Text,
} from "react-native";
import { MaterialIconsRounded } from "@/components/primitives/MaterialIconsRounded";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
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
      className="flex-row items-center gap-2 min-h-[40px] px-4 py-2 rounded-full border"
      style={[
        animatedStyle,
        {
          backgroundColor: isActive ? APPLE_THEME.focusBlue : APPLE_THEME.surface,
          borderColor: isActive ? APPLE_THEME.focusBlue : APPLE_THEME.border,
          borderCurve: "continuous",
        },
        isActive
          ? Platform.select({
              ios: TOKENS.shadow.sm,
              android: { elevation: 2 },
            })
          : null,
      ]}
    >
      <MaterialIconsRounded
        name={icon}
        size={16}
        color={isActive ? APPLE_THEME.white : APPLE_THEME.text}
      />
      <Text
        className="text-sm font-semibold"
        style={{
          color: isActive ? APPLE_THEME.white : APPLE_THEME.text,
          fontFamily: TOKENS.font.semibold,
        }}
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
      contentContainerStyle={{
        gap: 8,
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 8,
      }}
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
