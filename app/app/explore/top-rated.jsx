import { useMemo } from "react";
import { useExplore } from "../../src/modules/explore/hooks/useExplore";
import { ExploreListScaffold } from "../../src/modules/explore/components/ExploreListScaffold";
import { ExplorePlaceList } from "../../src/modules/explore/components/ExplorePlaceList";

export default function ExploreTopRatedScreen() {
  const { data, isLoading, refetch } = useExplore({ categoryId: null });

  const places = useMemo(() => {
    const raw = data?.pages.flatMap((p) => p?.data || []) ?? [];
    return [...raw]
      .filter((p) => Number(p?.ratingAvg ?? p?.averageRating ?? 0) > 0)
      .sort(
        (a, b) =>
          Number(b?.ratingAvg ?? b?.averageRating ?? 0) -
          Number(a?.ratingAvg ?? a?.averageRating ?? 0),
      )
      .slice(0, 60);
  }, [data]);

  return (
    <ExploreListScaffold
      title="Top đánh giá"
      subtitle="Những điểm đến được đánh giá cao nhất."
      rightAction={null}
    >
      <ExplorePlaceList
        data={places}
        loading={isLoading}
        emptyTitle="Chưa có dữ liệu đánh giá"
        emptyCopy="Hãy quay lại sau khi có thêm đánh giá từ cộng đồng."
        onEndReached={refetch}
      />
    </ExploreListScaffold>
  );
}

