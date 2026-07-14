export const getPlaceRatingValue = (place) => {
  const parsed = Number(place?.ratingAvg ?? place?.averageRating ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getPlaceReviewCount = (place) => {
  const parsed = Number(place?.reviewCount ?? place?._count?.reviews ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};
