import { useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import { useExplore } from "../../../src/modules/explore/hooks/useExplore";
import { ExploreListScaffold } from "../../../src/modules/explore/components/ExploreListScaffold";
import { ExplorePlaceList } from "../../../src/modules/explore/components/ExplorePlaceList";

export default function ExploreDistrictDetailScreen() {
  const params = useLocalSearchParams();
  const districtId = Number(params?.id);
  const districtName = String(params?.name || "Khu vực");

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExplore({ districtId: Number.isFinite(districtId) ? districtId : null });

  const places = useMemo(
    () => data?.pages.flatMap((p) => p?.data || []) ?? [],
    [data],
  );

  return (
    <ExploreListScaffold
      title={districtName}
      subtitle="Địa điểm nổi bật trong khu vực bạn chọn."
    >
      <ExplorePlaceList
        data={places}
        loading={isLoading}
        fetchingMore={isFetchingNextPage}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        emptyTitle="Chưa có địa điểm trong khu vực này"
        emptyCopy="Hãy thử khu vực khác hoặc quay lại sau."
      />
    </ExploreListScaffold>
  );
}

