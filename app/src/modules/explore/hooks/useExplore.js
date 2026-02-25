/**
 * useExplore — infinite scroll powered by GET /app/places
 * Supports full-text search, category filter, district filter, and pagination.
 */
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { searchPlacesApi, getHomeApi } from "../api/exploreApi";

const PAGE_LIMIT = 12;

export function useExplore({
  search = "",
  categoryId = null,
  districtId = null,
} = {}) {
  return useInfiniteQuery({
    queryKey: ["explore", { search, categoryId, districtId }],
    queryFn: ({ pageParam = 1 }) =>
      searchPlacesApi({
        page: pageParam,
        limit: PAGE_LIMIT,
        search: search || undefined,
        categoryId: categoryId || undefined,
        districtId: districtId || undefined,
      }),
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

/** Load categories for filter chips from the home endpoint */
export function useCategories() {
  return useQuery({
    queryKey: ["home-categories"],
    queryFn: () => getHomeApi({ limit: 1 }),
    select: (data) => data?.data?.categories || [],
    staleTime: 10 * 60 * 1000,
  });
}
