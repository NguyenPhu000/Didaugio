import {
  ALL_AREAS_KEY,
  BUDGET_PRICE_RANGES,
  PREMIUM_PRICE_RANGES,
} from "../constants/filter.constants";

export const parseTimeToMinutes = (timeText) => {
  if (typeof timeText !== "string") return null;
  const [hourText, minuteText] = timeText.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
};

export const isPlaceOpenNow = (place) => {
  const openingHours = Array.isArray(place?.openingHours)
    ? place.openingHours
    : [];

  // API chưa trả openingHours thì không loại bỏ marker hiện có.
  if (openingHours.length === 0) return true;

  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSchedule = openingHours.find(
    (item) => Number(item?.dayOfWeek) === currentDay,
  );

  if (!currentSchedule) return true;
  if (currentSchedule?.isClosed) return false;

  const openMinutes = parseTimeToMinutes(currentSchedule?.openTime);
  const closeMinutes = parseTimeToMinutes(currentSchedule?.closeTime);

  if (openMinutes == null || closeMinutes == null) return true;

  if (closeMinutes >= openMinutes) {
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  // Trường hợp qua đêm: ví dụ 22:00 -> 02:00.
  return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
};

export const getPlaceDistrictMeta = (place) => {
  const districtId =
    place?.district?.id ?? place?.ward?.districtId ?? place?.districtId;
  const districtName =
    place?.district?.name ?? place?.ward?.district?.name ?? null;

  if (districtId != null) {
    return {
      key: `id:${districtId}`,
      name: districtName || `Khu vực ${districtId}`,
    };
  }

  if (districtName) {
    return {
      key: `name:${districtName.trim().toLowerCase()}`,
      name: districtName,
    };
  }

  return null;
};

export const filterVisiblePlaces = ({
  places,
  searchText,
  activeCategoryId,
  activeArea,
  quickFilters,
  getRatingValue,
  getReviewCount,
  allAreasKey = ALL_AREAS_KEY,
}) => {
  const normalizedSearch = String(searchText || "")
    .trim()
    .toLowerCase();

  return places.filter((place) => {
    if (
      !Number.isFinite(place?.latitude) ||
      !Number.isFinite(place?.longitude)
    ) {
      return false;
    }

    const categoryId = place?.categoryId ?? place?.category?.id;
    if (
      activeCategoryId !== null &&
      String(categoryId ?? "") !== String(activeCategoryId)
    ) {
      return false;
    }

    if (activeArea !== allAreasKey) {
      const district = getPlaceDistrictMeta(place);
      if (!district || district.key !== activeArea) {
        return false;
      }
    }

    if (normalizedSearch) {
      const searchableText = [
        place?.name,
        place?.address,
        place?.category?.name,
        place?.ward?.name,
        place?.district?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(normalizedSearch)) {
        return false;
      }
    }

    if (quickFilters.topRated && getRatingValue(place) < 4.5) {
      return false;
    }

    if (quickFilters.trending && getReviewCount(place) < 20) {
      return false;
    }

    const priceRangeKey = String(place?.priceRange || "").toUpperCase();
    if (quickFilters.budget && !BUDGET_PRICE_RANGES.has(priceRangeKey)) {
      return false;
    }
    if (quickFilters.premium && !PREMIUM_PRICE_RANGES.has(priceRangeKey)) {
      return false;
    }

    if (quickFilters.openNow && !isPlaceOpenNow(place)) {
      return false;
    }

    return true;
  });
};
