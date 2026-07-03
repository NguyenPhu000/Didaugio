import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { useApiQuery } from "./useApiQuery";
import { useApiMutation, invalidateQueries } from "./useApiMutation";
import adminReviewApi from "@/apis/adminReviewApi";

/**
 * Fetch admin reviews with filters.
 */
export function useAdminReviews(params = {}) {
  return useApiQuery(
    queryKeys.reviews.list(params),
    () => adminReviewApi.getAdminReviews(params),
    { placeholderData: (prev) => prev }
  );
}

/**
 * Fetch admin review stats.
 */
export function useAdminReviewStats() {
  return useApiQuery(queryKeys.reviews.all(), () =>
    adminReviewApi.getAdminReviewStats()
  );
}

/**
 * Moderate review mutation.
 */
export function useModerateReview() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ id, data }) => adminReviewApi.moderateAdminReview(id, data),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [queryKeys.reviews.all()]);
      },
    }
  );
}

/**
 * Moderate review reply mutation.
 */
export function useModerateReviewReply() {
  const queryClient = useQueryClient();
  return useApiMutation(
    ({ reviewId, replyId, data }) =>
      adminReviewApi.moderateAdminReviewReply(reviewId, replyId, data),
    {
      onSuccess: () => {
        invalidateQueries(queryClient, [queryKeys.reviews.all()]);
      },
    }
  );
}
