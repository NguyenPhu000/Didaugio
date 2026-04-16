import { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { useExplore, useCategories } from "../../../src/modules/explore/hooks/useExplore";
import { ExploreListScaffold } from "../../../src/modules/explore/components/ExploreListScaffold";
import { ExplorePlaceList } from "../../../src/modules/explore/components/ExplorePlaceList";

export default function ExploreCategoryDetailScreen() {
  const params = useLocalSearchParams();
  const rawId = params?.id;
  const categoryId = rawId === "all" ? null : Number(rawId);

  const { data: categories = [] } = useCategories();
  const categoryName = useMemo(() => {
    if (!categoryId) return "Tất cả";
    return categories.find((c) => Number(c.id) === categoryId)?.name || "Danh mục";
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
      subtitle="Những địa điểm phù hợp để bạn bắt đầu khám phá."
    >
      <ExplorePlaceList
        data={places}
        loading={isLoading}
        fetchingMore={isFetchingNextPage}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        emptyTitle="Chưa có địa điểm trong danh mục này"
        emptyCopy="Hãy thử danh mục khác hoặc quay lại sau."
      />
    </ExploreListScaffold>
  );
}

