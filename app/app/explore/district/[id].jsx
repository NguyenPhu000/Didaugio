import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams } from "expo-router";
import { useExplore } from "../../../src/modules/explore/hooks/useExplore";
import { ExploreListScaffold } from "../../../src/modules/explore/components/ExploreListScaffold";
import { ExplorePlaceList } from "../../../src/modules/explore/components/ExplorePlaceList";

export default function ExploreDistrictDetailScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const districtId = Number(params?.id);
  const districtName = String(params?.name || t("exploreDistrict.area"));

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
      subtitle={t("exploreDistrict.subtitle")}
    >
      <ExplorePlaceList
        data={places}
        loading={isLoading}
        fetchingMore={isFetchingNextPage}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        emptyTitle={t("exploreDistrict.noPlaces")}
        emptyCopy={t("exploreDistrict.noPlacesDesc")}
      />
    </ExploreListScaffold>
  );
}

