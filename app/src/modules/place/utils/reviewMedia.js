export const REVIEW_MEDIA_LIMIT = 3;

export function buildReviewMediaPayload(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => String(item?.dataUrl || "").trim())
    .filter(Boolean)
    .slice(0, REVIEW_MEDIA_LIMIT)
    .map((mediaData, order) => ({
      mediaData,
      mediaType: "image",
      order,
    }));
}
