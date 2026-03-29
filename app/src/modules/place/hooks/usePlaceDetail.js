import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPlaceDetailApi,
  getPlaceReviewsApi,
  createReviewApi,
} from "../api/placeApi";

export function usePlaceDetail(id) {
  const parsedId = Number(id);
  const isValidId = Number.isFinite(parsedId) && parsedId > 0;

  return useQuery({
    queryKey: ["place", isValidId ? parsedId : "invalid"],
    queryFn: () => getPlaceDetailApi(parsedId),
    select: (data) => data?.data || data,
    enabled: isValidId,
  });
}

export function usePlaceReviews(id, params = {}) {
  const parsedId = Number(id);
  const isValidId = Number.isFinite(parsedId) && parsedId > 0;

  return useQuery({
    queryKey: ["place-reviews", isValidId ? parsedId : "invalid", params],
    queryFn: () => getPlaceReviewsApi(parsedId, params),
    select: (data) => ({
      reviews: data?.data || [],
      pagination: data?.pagination,
    }),
    enabled: isValidId,
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
