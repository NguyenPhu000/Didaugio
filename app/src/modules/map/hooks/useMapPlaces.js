import { useQuery } from "@tanstack/react-query";
import { getMapPlacesApi } from "../api/mapApi";
import { QUERY_KEYS } from "../../../constants/query-keys";
import { normalizePlaces } from "../../../lib/place";

const MAP_PLACES_LIMIT = 500;

export function useMapPlaces() {
  return useQuery({
    queryKey: QUERY_KEYS.places.list({ status: "approved", limit: MAP_PLACES_LIMIT }),
    queryFn: () => getMapPlacesApi({ limit: MAP_PLACES_LIMIT }),
    staleTime: 5 * 60 * 1000,
    select: (res) => normalizePlaces(res?.data),
  });
}
