import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchPlacesApi } from "../../src/modules/explore/api/exploreApi";
import { PLACE_STATUS } from "../../src/constants/preferences";
import { normalizePlaces } from "../../src/lib/place";
import { ExploreListScaffold } from "../../src/modules/explore/components/ExploreListScaffold";
import { ExplorePlaceList } from "../../src/modules/explore/components/ExplorePlaceList";

const LIMIT = 60;

export default function ExploreNewestScreen() {
  const query = useQuery({
    queryKey: ["explore-newest", LIMIT],
    queryFn: () =>
      searchPlacesApi({
        page: 1,
        limit: LIMIT,
        status: PLACE_STATUS.APPROVED,
        sortBy: "newest",
      }).then((res) => ({
        ...res,
        data: normalizePlaces(res?.data),
      })),
    staleTime: 3 * 60 * 1000,
  });

  const places = useMemo(() => query.data?.data || [], [query.data]);

  return (
    <ExploreListScaffold
      title="Mới nhất"
      subtitle="Các địa điểm vừa được cập nhật gần đây."
    >
      <ExplorePlaceList
        data={places}
        loading={query.isLoading}
        onEndReached={query.refetch}
        emptyTitle="Chưa có dữ liệu mới"
        emptyCopy="Hãy quay lại sau để xem các địa điểm mới cập nhật."
      />
    </ExploreListScaffold>
  );
}

