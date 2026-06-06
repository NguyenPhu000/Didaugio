import { useQuery } from "@tanstack/react-query";

/**
 * Thin wrapper around useQuery for API calls.
 *
 * @param {Array} queryKey - Query key array (use queryKeys factory)
 * @param {Function} queryFn - Async function that calls the API service
 * @param {Object} options - Additional TanStack Query options
 * @returns {UseQueryResult}
 *
 * @example
 * const { data, isLoading } = useApiQuery(
 *   queryKeys.places.list(params),
 *   () => placeService.getAllPlaces(params)
 * );
 */
export function useApiQuery(queryKey, queryFn, options = {}) {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}
