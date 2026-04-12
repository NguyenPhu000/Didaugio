import { useQuery } from "@tanstack/react-query";
import { getMapPlacesApi } from "../api/mapApi";
import { QUERY_KEYS } from "../../../constants/query-keys";
import { normalizePlaces } from "../../../lib/place";

const MAP_PLACES_LIMIT = 500;

const toNumberOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeMapPlace = (place) => {
  const normalized = {
    ...place,
    latitude:
      toNumberOrNull(place?.latitude) ??
      toNumberOrNull(place?.lat) ??
      toNumberOrNull(place?.location?.lat) ??
      null,
    longitude:
      toNumberOrNull(place?.longitude) ??
      toNumberOrNull(place?.lng) ??
      toNumberOrNull(place?.location?.lng) ??
      null,
  };
  return normalized;
};

const extractPlacesPayload = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

export function useMapPlaces() {
  return useQuery({
    queryKey: QUERY_KEYS.places.list({ status: "approved", limit: MAP_PLACES_LIMIT }),
    queryFn: () => getMapPlacesApi({ limit: MAP_PLACES_LIMIT }),
    staleTime: 5 * 60 * 1000,
    select: (res) =>
      normalizePlaces(extractPlacesPayload(res))
        .map(normalizeMapPlace)
        .filter(
          (place) =>
            place?.id != null &&
            Number.isFinite(place?.latitude) &&
            Number.isFinite(place?.longitude),
        ),
  });
}
