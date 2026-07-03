import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useExplore } from "../../src/modules/explore/hooks/useExplore";
import { ExploreListScaffold } from "../../src/modules/explore/components/ExploreListScaffold";
import { ExplorePlaceList } from "../../src/modules/explore/components/ExplorePlaceList";

export default function ExploreTopRatedScreen() {
  const { t } = useTranslation();
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
      title={t("exploreTopRated.title")}
      subtitle={t("exploreTopRated.subtitle")}
      rightAction={null}
    >
      <ExplorePlaceList
        data={places}
        loading={isLoading}
        emptyTitle={t("exploreTopRated.noData")}
        emptyCopy={t("exploreTopRated.noDataDesc")}
        onEndReached={refetch}
      />
    </ExploreListScaffold>
  );
}

