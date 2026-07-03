import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toastApiErrorIfNeeded } from "@/utils/businessApiErrorUx";

/**
 * Thin wrapper around useMutation with default error handling.
 *
 * @param {Function} mutationFn - Async function that calls the API service
 * @param {Object} options - Additional TanStack Query options
 * @returns {UseMutationResult}
 *
 * @example
 * const mutation = useApiMutation(
 *   (data) => placeService.createPlace(data),
 *   {
 *     onSuccess: () => {
 *       queryClient.invalidateQueries({ queryKey: queryKeys.places.all() });
 *     },
 *   }
 * );
 */
export function useApiMutation(mutationFn, options = {}) {
  return useMutation({
    mutationFn,
    onError: (error) => {
      toastApiErrorIfNeeded(error);
      options.onError?.(error);
    },
    ...options,
  });
}

/**
 * Helper: invalidate one or more query key groups after a mutation.
 *
 * @param {QueryClient} queryClient
 * @param {Array<Array>} keys - Array of query key arrays to invalidate
 *
 * @example
 * await invalidateQueries(queryClient, [
 *   queryKeys.places.all(),
 *   queryKeys.places.list(),
 * ]);
 */
export async function invalidateQueries(queryClient, keys) {
  await Promise.all(
    keys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
  );
}
