import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import placeService from "@/apis/placeService";

/**
 * Fetch all places with filters.
 */
export function usePlaces(params = {}) {
  return useApiQuery(
    queryKeys.places.list(params),
    () => placeService.getAllPlaces(params),
    { placeholderData: (prev) => prev }
  );
}

/**
 * Fetch place by ID.
 */
export function usePlaceDetail(id) {
  return useApiQuery(
    queryKeys.places.detail(id),
    () => placeService.getPlaceById(id),
    { enabled: !!id }
  );
}

/**
 * Fetch place by slug.
 */
export function usePlaceBySlug(slug) {
  return useApiQuery(
    queryKeys.places.bySlug(slug),
    () => placeService.getPlaceBySlug(slug),
    { enabled: !!slug }
  );
}

/**
 * Fetch featured places.
 */
export function useFeaturedPlaces(limit = 10, categoryId = null) {
  return useApiQuery(
    queryKeys.places.featured(),
    () => placeService.getFeaturedPlaces(limit, categoryId),
    { staleTime: 10 * 60 * 1000 }
  );
}

/**
 * Fetch nearby places.
 */
export function useNearbyPlaces(latitude, longitude, radius = 5, limit = 10) {
  return useApiQuery(
    queryKeys.places.nearby({ latitude, longitude, radius }),
    () => placeService.getNearbyPlaces(latitude, longitude, radius, limit),
    { enabled: !!latitude && !!longitude }
  );
}

/**
 * Create place mutation.
 */
export function useCreatePlace() {
  const queryClient = useQueryClient();
  return useApiMutation((data) => placeService.createPlace(data), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.places.all()]);
    },
  });
}

/**
 * Update place mutation.
 */
export function useUpdatePlace() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, data }) => placeService.updatePlace(id, data),
    {
      onSuccess: (_data, variables) => {
        invalidateQueries(queryClient, [
          queryKeys.places.all(),
          queryKeys.places.detail(variables.id),
        ]);
      },
    }
  );
}

/**
 * Delete place mutation.
 */
export function useDeletePlace() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => placeService.deletePlace(id), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.places.all()]);
    },
  });
}

/**
 * Update place status mutation.
 */
export function useUpdatePlaceStatus() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, status }) => placeService.updatePlaceStatus(id, status),
    {
      onSuccess: (_data, variables) => {
        invalidateQueries(queryClient, [
          queryKeys.places.all(),
          queryKeys.places.detail(variables.id),
        ]);
      },
    }
  );
}

/**
 * Approve place mutation.
 */
export function useApprovePlace() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => placeService.approvePlace(id), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.places.all()]);
    },
  });
}

/**
 * Reject place mutation.
 */
export function useRejectPlace() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, reason }) => placeService.rejectPlace(id, reason),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [queryKeys.places.all()]);
      },
    }
  );
}

/**
 * Toggle feature mutation.
 */
export function useToggleFeature() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => placeService.toggleFeature(id), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.places.all()]);
    },
  });
}

/**
 * Toggle verify mutation.
 */
export function useToggleVerify() {
  const queryClient = useQueryClient();
  return useApiMutation((id) => placeService.toggleVerify(id), {
    onSuccess: () => {
      invalidateQueries(queryClient, [queryKeys.places.all()]);
    },
  });
}

/**
 * Check if a slug exists. Returns a callable async function.
 * Use in components: const { mutateAsync: checkSlug } = useCheckSlugExists();
 */
export function useCheckSlugExists() {
  return useApiMutation(({ slug, excludeId }) =>
    placeService.checkSlugExists(slug, excludeId)
  );
}
