import { memo, useCallback } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../../constants/design-tokens";

const PillItem = memo(function PillItem({
  categoryId,
  icon,
  isActive,
  label,
  onPressCategory,
}) {
  const handlePress = useCallback(() => {
    onPressCategory(categoryId);
  }, [categoryId, onPressCategory]);

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
    >
      <MaterialIcons
        name={icon}
        size={16}
        color={isActive ? APPLE_THEME.white : APPLE_THEME.textSecondary}
      />
      <Text style={[styles.pillText, isActive ? styles.pillTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}, arePillItemPropsEqual);

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
            : selectedCategory === item.categoryId
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

function arePillItemPropsEqual(prev, next) {
  return (
    prev.categoryId === next.categoryId &&
    prev.icon === next.icon &&
    prev.isActive === next.isActive &&
    prev.label === next.label &&
    prev.onPressCategory === next.onPressCategory
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
    paddingTop: 14,
    paddingBottom: 6,
    paddingRight: 14,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: TOKENS.radius.pill,
  },
  pillActive: {
    backgroundColor: APPLE_THEME.primary,
    borderWidth: 1,
    borderColor: APPLE_THEME.primary,
    ...Platform.select({
      ios: {
        ...TOKENS.shadow.sm,
      },
      android: { elevation: TOKENS.shadow.sm.elevation },
    }),
  },
  pillInactive: {
    backgroundColor: APPLE_THEME.surface,
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
  },
  pillText: {
    color: APPLE_THEME.textSecondary,
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  pillTextActive: {
    color: APPLE_THEME.white,
  },
});
