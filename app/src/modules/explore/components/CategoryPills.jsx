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
import { TOKENS } from "../../../constants/design-tokens";

const ACTIVE_BG = "#101E2C";
const INACTIVE_BG = TOKENS.color.card.light;

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
        color={isActive ? "#FFFFFF" : "#3A4858"}
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
    backgroundColor: ACTIVE_BG,
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#191c1e",
        shadowOffset: { width: 0, height: 9 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
      },
      android: { elevation: 7 },
    }),
  },
  pillInactive: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: "rgba(196,198,204,0.75)",
  },
  pillText: {
    color: "#3A4858",
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
  },
  pillTextActive: {
    color: "#FFFFFF",
  },
});
