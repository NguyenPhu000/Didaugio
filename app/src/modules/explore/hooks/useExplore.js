import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { searchPlacesApi, getHomeApi } from "../api/exploreApi";
import { QUERY_KEYS } from "../../../constants/query-keys";
import { PLACE_STATUS } from "../../../constants/preferences";
import { normalizePlaces } from "../../../lib/place";

const PAGE_LIMIT = 12;

export function buildExploreQueryOptions({
  search = "",
  categoryId = null,
  districtId = null,
  priceRange = null,
  minRating = null,
  sortBy = "newest",
  enabled = true,
  compact = true,
} = {}) {
  const filters = {
    search,
    categoryId,
    districtId,
    priceRange,
    minRating,
    sortBy,
    compact,
  };
  return {
    queryKey: QUERY_KEYS.explore.list(filters),
    queryFn: ({ pageParam = 1, signal }) =>
      searchPlacesApi({
        page: pageParam,
        limit: PAGE_LIMIT,
        status: PLACE_STATUS.APPROVED,
        compact,
        search: search || undefined,
        categoryId: categoryId || undefined,
        districtId: districtId || undefined,
        priceRange: priceRange || undefined,
        minRating: minRating || undefined,
        sortBy: sortBy || undefined,
      }, { signal }).then((res) => ({
        ...res,
        data: normalizePlaces(res?.data),
      })),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      if (!pagination) return undefined;
      const { page, totalPages } = pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled,
    initialPageParam: 1,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  };
}

export function useExplore(options = {}) {
  return useInfiniteQuery(buildExploreQueryOptions(options));
}

export function useCategories() {
  return useQuery({
    queryKey: ["home-categories"],
    queryFn: ({ signal }) => getHomeApi({ limit: 1 }, { signal }),
    select: (data) =>
      data?.categories ||
      data?.data?.categories ||
      data?.data?.data?.categories ||
      [],
    staleTime: 10 * 60 * 1000,
  });
}
