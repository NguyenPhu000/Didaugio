const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const pickPlaceId = (place) =>
  place?.id ??
  place?.placeId ??
  place?._id ??
  place?.place?.id ??
  place?.place?._id ??
  null;

export const normalizePlace = (place) => {
  if (!place) return place;

  return {
    ...place,
    id: pickPlaceId(place),
    categoryId: toNumberOrNull(place.categoryId) ?? place.category?.id ?? null,
    districtId: toNumberOrNull(place.districtId) ?? place.district?.id ?? null,
    wardId: toNumberOrNull(place.wardId) ?? place.ward?.id ?? null,
    latitude: toNumberOrNull(place.latitude),
    longitude: toNumberOrNull(place.longitude),
    ratingAvg: toNumberOrNull(place.ratingAvg) ?? 0,
    averageRating: toNumberOrNull(place.averageRating) ?? 0,
    reviewCount:
      toNumberOrNull(place.reviewCount) ??
      toNumberOrNull(place._count?.reviews) ??
      0,
    favoriteCount:
      toNumberOrNull(place.favoriteCount) ??
      toNumberOrNull(place._count?.favorites) ??
      0,
    checkinCount:
      toNumberOrNull(place.checkinCount) ??
      toNumberOrNull(place._count?.checkins) ??
      0,
    viewCount: toNumberOrNull(place.viewCount) ?? 0,
  };
};

export const normalizePlaces = (places) =>
  Array.isArray(places) ? places.map(normalizePlace) : [];
