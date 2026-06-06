import { memo, useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { TOKENS } from "../../src/constants/design-tokens";
import {
  useCategories,
  useExplore,
} from "../../src/modules/explore/hooks/useExplore";
import { ExploreListScaffold } from "../../src/modules/explore/components/ExploreListScaffold";
import {
  SmallPlaceCard,
  SMALL_CARD_W,
} from "../../src/modules/explore/components/SmallPlaceCard";


// Map custom modern icons for categories
const CATEGORY_ICON_MAP = {
  "ẩm thực": "silverware-fork-knife",
  "khách sạn": "bed-outline",
  "lưu trú": "bed-outline",
  "cafe": "coffee-outline",
  "cà phê": "coffee-outline",
  "mua sắm": "shopping-outline",
  "chợ": "storefront-outline",
  "văn hóa": "bank-outline",
  "bảo tàng": "bank-outline",
  "lịch sử": "bank-outline",
  "thiên nhiên": "leaf",
  "sinh thái": "pine-tree",
  "sự kiện": "calendar-blank-outline",
  "chùa": "temple-buddhist",
  "giải trí": "gamepad-variant-outline",
  "phương tiện": "bus",
  "di chuyển": "car-outline",
  "biển": "beach",
};

function getModernIcon(name) {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return "shape-outline";
}

// ==== CATEGORY ROW SECTION ====
const CategorySection = memo(function CategorySection({ category }) {
  const { t } = useTranslation();
  const router = useRouter();
  // Fetch places specific to this category
  const { data, isLoading } = useExplore({
    categoryId: category.id,
    enabled: true,
  });

  const places = useMemo(
    () => data?.pages.flatMap((p) => p?.data || []) ?? [],
    [data],
  );

  // If no places and done loading, hide the row entirely
  if (!isLoading && places.length === 0) return null;

  return (
    <View>
      <View className="flex-row items-center justify-between px-6 mb-[14px]">
        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-full bg-[#F3F4F6] items-center justify-center">
            <MaterialCommunityIcons name={category.icon} size={18} color="#000" />
          </View>
          <Text className="text-black text-[22px] font-bold tracking-[-0.5px]">{category.name}</Text>
        </View>

        <Pressable
          hitSlop={10}
          onPress={() =>
            router.push({
              pathname: "/explore/category/[id]",
              params: { id: String(category.id) },
            })
          }
          className="flex-row items-center"
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <Text className="text-[#8E8E93] text-[15px] font-medium">{t("exploreCategories.viewAll")}</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#6B7280" />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="h-[220px] items-center justify-center">
          <ActivityIndicator color="#000" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: TOKENS.space[6], paddingBottom: 8 }}
          snapToInterval={SMALL_CARD_W + 16}
          decelerationRate="fast"
        >
          {places.slice(0, 8).map((place) => ( // Show max 8 places per row inline
            <View key={place.id} className="mr-4">
              <SmallPlaceCard
                place={place}
                onPress={() =>
                  router.push({ pathname: "/place/[id]", params: { id: place.id } })
                }
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
});

// ==== MAIN SCREEN ====
export default function ExploreCategoriesScreen() {
  const { t } = useTranslation();
  const { data: categories = [], isLoading } = useCategories();

  const items = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        icon: getModernIcon(c.name),
      })),
    [categories],
  );

  return (
    <ExploreListScaffold
      title={t("exploreCategories.title")}
      subtitle={t("exploreCategories.subtitle")}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 80, gap: 36 }}
      >
        {isLoading ? (
          <Text className="text-[#6B7280] text-[14px] font-sans py-[30px] text-center">
            {t("exploreCategories.loading")}
          </Text>
        ) : (
          items.map((item) => (
            <CategorySection key={item.id} category={item} />
          ))
        )}
      </ScrollView>
    </ExploreListScaffold>
  );
}
