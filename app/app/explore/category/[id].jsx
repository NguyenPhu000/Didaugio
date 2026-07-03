import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams } from "expo-router";
import { useExplore, useCategories } from "../../../src/modules/explore/hooks/useExplore";
import { ExploreListScaffold } from "../../../src/modules/explore/components/ExploreListScaffold";
import { ExplorePlaceList } from "../../../src/modules/explore/components/ExplorePlaceList";

export default function ExploreCategoryDetailScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const rawId = params?.id;
  const categoryId = rawId === "all" ? null : Number(rawId);

  const { data: categories = [] } = useCategories();
  const categoryName = useMemo(() => {
    if (!categoryId) return t("exploreCategory.all");
    return categories.find((c) => Number(c.id) === categoryId)?.name || t("exploreCategory.category");
  }, [categories, categoryId]);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExplore({ categoryId: categoryId || null });

  const places = useMemo(
    () => data?.pages.flatMap((p) => p?.data || []) ?? [],
    [data],
  );

  return (
    <ExploreListScaffold
      title={categoryName}
      subtitle={t("exploreCategory.subtitle")}
    >
      <ExplorePlaceList
        data={places}
        loading={isLoading}
        fetchingMore={isFetchingNextPage}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        emptyTitle={t("exploreCategory.noPlaces")}
        emptyCopy={t("exploreCategory.noPlacesDesc")}
      />
    </ExploreListScaffold>
  );
}

