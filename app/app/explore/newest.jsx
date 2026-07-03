import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { searchPlacesApi } from "../../src/modules/explore/api/exploreApi";
import { PLACE_STATUS } from "../../src/constants/preferences";
import { normalizePlaces } from "../../src/lib/place";
import { ExploreListScaffold } from "../../src/modules/explore/components/ExploreListScaffold";
import { ExplorePlaceList } from "../../src/modules/explore/components/ExplorePlaceList";

const LIMIT = 60;

export default function ExploreNewestScreen() {
  const { t } = useTranslation();
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
      title={t("exploreNewest.title")}
      subtitle={t("exploreNewest.subtitle")}
    >
      <ExplorePlaceList
        data={places}
        loading={query.isLoading}
        onEndReached={query.refetch}
        emptyTitle={t("exploreNewest.noData")}
        emptyCopy={t("exploreNewest.noDataDesc")}
      />
    </ExploreListScaffold>
  );
}

