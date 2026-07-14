import { memo, useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { TOKENS } from "../../src/constants/design-tokens";
import { getCategoryIconName } from "../../src/constants/categoryIcons";
import { useCategories, useExplore } from "../../src/modules/explore/hooks/useExplore";
import { ExploreListScaffold } from "../../src/modules/explore/components/ExploreListScaffold";
import { SmallPlaceCard, SMALL_CARD_W } from "../../src/modules/explore/components/SmallPlaceCard";

const CategorySection = memo(function CategorySection({ category }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading } = useExplore({ categoryId: category.id });
  const places = useMemo(() => data?.pages.flatMap((page) => page?.data || []) ?? [], [data]);

  if (!isLoading && places.length === 0) return null;

  return (
    <View>
      <View className="flex-row items-center justify-between px-6 mb-[14px]">
        <View className="flex-row items-center gap-2 flex-1 mr-3">
          <View className="w-7 h-7 rounded-full bg-[#F3F4F6] items-center justify-center">
            <MaterialCommunityIcons name={category.icon} size={18} color="#000" />
          </View>
          <Text className="text-black text-[22px] font-bold tracking-[-0.5px]" numberOfLines={1}>
            {category.name}
          </Text>
        </View>
        <Pressable
          hitSlop={10}
          onPress={() => router.push({ pathname: "/explore/category/[id]", params: { id: String(category.id) } })}
          className="flex-row items-center"
          style={({ pressed }) => pressed && { opacity: 0.6 }}
        >
          <Text className="text-[#8E8E93] text-[15px] font-medium">{t("exploreCategories.viewAll")}</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#6B7280" />
        </Pressable>
      </View>
      {isLoading ? (
        <View className="h-[220px] items-center justify-center"><ActivityIndicator color="#000" /></View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: TOKENS.space[6], paddingBottom: 8 }} snapToInterval={SMALL_CARD_W + 16} decelerationRate="fast">
          {places.slice(0, 8).map((place) => (
            <View key={place.id} className="mr-4">
              <SmallPlaceCard place={place} onPress={() => router.push({ pathname: "/place/[id]", params: { id: place.id } })} />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
});

export default function ExploreCategoriesScreen() {
  const { t } = useTranslation();
  const { data: categories = [], isLoading } = useCategories();
  const items = useMemo(
    () => categories.map((category) => ({ id: category.id, name: category.name, icon: getCategoryIconName(category) })),
    [categories],
  );

  return (
    <ExploreListScaffold title={t("exploreCategories.title")} subtitle={t("exploreCategories.subtitle")}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10, paddingBottom: 80, gap: 36 }}>
        {isLoading ? (
          <Text className="text-[#6B7280] text-[14px] font-sans py-[30px] text-center">{t("exploreCategories.loading")}</Text>
        ) : (
          items.map((item) => <CategorySection key={item.id} category={item} />)
        )}
      </ScrollView>
    </ExploreListScaffold>
  );
}
