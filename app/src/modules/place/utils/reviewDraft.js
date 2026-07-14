import { REVIEW_MEDIA_LIMIT } from "./reviewMedia";

export function toReviewDraft(review) {
  return {
    rating: Number(review?.rating) || 0,
    content: String(review?.content || ""),
    visitType: review?.visitType || null,
    media: (review?.media || [])
      .map((item) => String(item?.mediaData || "").trim())
      .filter(Boolean)
      .slice(0, REVIEW_MEDIA_LIMIT)
      .map((dataUrl) => ({ dataUrl })),
  };
}
