import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { searchPlacesApi, getHomeApi } from "../api/exploreApi";
import { QUERY_KEYS } from "../../../constants/query-keys";
import { PLACE_STATUS } from "../../../constants/preferences";
import { normalizePlaces } from "../../../lib/place";

const PAGE_LIMIT = 12;

export function useExplore({
  search = "",
  categoryId = null,
  districtId = null,
} = {}) {
  const filters = { search, categoryId, districtId };
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.explore.list(filters),
    queryFn: ({ pageParam = 1 }) =>
      searchPlacesApi({
        page: pageParam,
        limit: PAGE_LIMIT,
        status: PLACE_STATUS.APPROVED,
        search: search || undefined,
        categoryId: categoryId || undefined,
        districtId: districtId || undefined,
      }).then((res) => ({
        ...res,
        data: normalizePlaces(res?.data),
      })),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      if (!pagination) return undefined;
      const { page, totalPages } = pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 3 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["home-categories"],
    queryFn: () => getHomeApi({ limit: 1 }),
    select: (data) => data?.data?.categories || [],
    staleTime: 10 * 60 * 1000,
  });
}
