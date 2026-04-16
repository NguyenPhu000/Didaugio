import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  BOOKING_APPLE_THEME as APPLE_THEME,
  TOKENS,
} from "../../src/constants/design-tokens";
import { useCategories } from "../../src/modules/explore/hooks/useExplore";
import { getCategoryIcon } from "../../src/modules/explore/utils/exploreHelpers";
import { ExploreListScaffold } from "../../src/modules/explore/components/ExploreListScaffold";

export default function ExploreCategoriesScreen() {
  const router = useRouter();
  const { data: categories = [], isLoading } = useCategories();

  const items = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        icon: getCategoryIcon(c.name),
      })),
    [categories],
  );

  return (
    <ExploreListScaffold
      title="Danh mục"
      subtitle="Chọn chủ đề bạn muốn khám phá."
    >
      <View style={styles.list}>
        {isLoading ? (
          <Text style={styles.loadingText}>Đang tải...</Text>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() =>
                router.push({
                  pathname: "/explore/category/[id]",
                  params: { id: String(item.id) },
                })
              }
              style={({ pressed }) => [
                styles.row,
                pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
              ]}
            >
              <View style={styles.iconWrap}>
                <MaterialIcons name={item.icon} size={20} color={APPLE_THEME.primary} />
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={APPLE_THEME.textMuted}
              />
            </Pressable>
          ))
        )}
      </View>
    </ExploreListScaffold>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: TOKENS.space[6],
    paddingTop: 16,
    paddingBottom: 24,
    gap: 10,
  },
  loadingText: {
    color: APPLE_THEME.textSecondary,
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    paddingVertical: 20,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: TOKENS.radius["3xl"],
    backgroundColor: APPLE_THEME.surface,
    borderWidth: 1,
    borderColor: APPLE_THEME.borderSoft,
    ...TOKENS.shadow.sm,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: APPLE_THEME.surfaceElevated,
    borderWidth: 1,
    borderColor: APPLE_THEME.border,
  },
  name: {
    flex: 1,
    minWidth: 0,
    color: APPLE_THEME.text,
    fontSize: 15.5,
    fontFamily: TOKENS.font.semibold,
  },
});

