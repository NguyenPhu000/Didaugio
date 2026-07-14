import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPlaceDetailApi,
  getPlaceDetailBySlugApi,
  getPlaceReviewsApi,
  getMyPlaceReviewApi,
  createReviewApi,
} from "../api/placeApi";

function normalizePlaceIdentifier(identifier) {
  const raw = Array.isArray(identifier) ? identifier[0] : identifier;
  const value = String(raw ?? "").trim();
  if (!value) return { kind: "invalid", value: null };

  const parsedId = Number(value);
  if (Number.isFinite(parsedId) && parsedId > 0) {
    return { kind: "id", value: parsedId };
  }

  return { kind: "slug", value };
}

export function usePlaceDetail(identifier) {
  const normalized = normalizePlaceIdentifier(identifier);
  const enabled = normalized.kind !== "invalid";

  return useQuery({
    queryKey: ["place", normalized.kind, normalized.value ?? "invalid"],
    queryFn: () =>
      normalized.kind === "id"
        ? getPlaceDetailApi(normalized.value)
        : getPlaceDetailBySlugApi(normalized.value),
    select: (data) => data?.data || data,
    enabled,
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

export function useMyPlaceReview(id, enabled = true) {
  const parsedId = Number(id);
  const isValidId = Number.isFinite(parsedId) && parsedId > 0;

  return useQuery({
    queryKey: ["my-place-review", isValidId ? parsedId : "invalid"],
    queryFn: () => getMyPlaceReviewApi(parsedId),
    select: (data) => data?.data || data || null,
    enabled: Boolean(enabled) && isValidId,
  });
}

export function useCreateReview(placeId) {
  const qc = useQueryClient();
  const parsedId = Number(placeId);
  const isValidId = Number.isFinite(parsedId) && parsedId > 0;

  return useMutation({
    mutationFn: (payload) => {
      if (!isValidId) {
        throw new Error("Không xác định được địa điểm để gửi đánh giá");
      }
      return createReviewApi(parsedId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["place-reviews", parsedId] });
      qc.invalidateQueries({ queryKey: ["my-place-review", parsedId] });
      qc.invalidateQueries({ queryKey: ["place"] });
    },
  });
}
