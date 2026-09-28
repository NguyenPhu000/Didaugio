import { memo, useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { EXPLORE_THEME as C } from "./exploreTheme";
import { TOKENS } from "../../../constants/design-tokens";

const CategoryPillItem = memo(function CategoryPillItem({
  item,
  selected,
  onSelect,
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, TOKENS.spring.press);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, TOKENS.spring.press);
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(item.categoryId);
  }, [item.categoryId, onSelect]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected }}
    >
      <Animated.View
        style={[
          styles.pill,
          selected ? styles.pillSelected : styles.pillDefault,
          animStyle,
        ]}
      >
        <MaterialCommunityIcons
          name={item.icon}
          size={16}
          color={selected ? "#FFFFFF" : C.muted}
        />
        <Text
          style={[styles.label, selected ? styles.labelSelected : styles.labelDefault]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

function CategoryPillsInner({
  categories,
  selectedCategory,
  onSelectCategory,
}) {
  const renderItem = useCallback(
    ({ item }) => (
      <CategoryPillItem
        item={item}
        selected={
          item.categoryId == null
            ? selectedCategory == null
            : String(item.categoryId) === String(selectedCategory)
        }
        onSelect={onSelectCategory}
      />
    ),
    [onSelectCategory, selectedCategory],
  );

  return (
    <View accessibilityRole="tablist" style={styles.wrap}>
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
    marginBottom: 6,
  },
  list: {
    paddingHorizontal: C.spacing,
    gap: 8,
  },
  pill: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillDefault: {
    backgroundColor: C.surface,
    borderWidth: 0.5,
    borderColor: "rgba(24, 48, 44, 0.08)",
  },
  pillSelected: {
    backgroundColor: C.river,
    borderWidth: 0.5,
    borderColor: C.riverDark,
    shadowColor: C.river,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  labelDefault: {
    fontFamily: C.font.medium,
    color: C.ink,
  },
  labelSelected: {
    fontFamily: C.font.semibold,
    color: "#FFFFFF",
  },
});

export const CategoryPills = memo(CategoryPillsInner);

