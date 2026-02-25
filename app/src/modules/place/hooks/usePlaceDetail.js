/**
 * usePlaceDetail — queries place detail by id
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPlaceDetailApi,
  getPlaceReviewsApi,
  createReviewApi,
} from "../api/placeApi";

export function usePlaceDetail(id) {
  return useQuery({
    queryKey: ["place", id],
    queryFn: () => getPlaceDetailApi(id),
    select: (data) => data?.data || data,
    enabled: !!id,
  });
}

export function usePlaceReviews(id, params = {}) {
  return useQuery({
    queryKey: ["place-reviews", id, params],
    queryFn: () => getPlaceReviewsApi(id, params),
    select: (data) => ({
      reviews: data?.data || [],
      pagination: data?.pagination,
    }),
    enabled: !!id,
  });
}

export function useCreateReview(placeId) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload) => createReviewApi(placeId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["place-reviews", placeId] });
      qc.invalidateQueries({ queryKey: ["place", placeId] });
    },
  });
}
