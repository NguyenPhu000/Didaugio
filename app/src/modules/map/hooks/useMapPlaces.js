import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWindowDimensions } from "react-native";
import { getMapPlacesApi } from "../api/mapApi";
import { normalizePlaces } from "../../../lib/place";
import { createMapViewport } from "../utils/mapViewport";
import { isValidMapViewport } from "../utils/mapViewportValidation";
import { regionToZoom } from "../utils/mapZoom";
import { getMapPlacesQueryOptions } from "./useMapPlacesQueryOptions";

const MAP_VIEWPORT_DEBOUNCE_MS = 250;

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

export function useMapPlaces(region) {
  const { width: viewportWidth } = useWindowDimensions();
  const latitude = region?.latitude;
  const longitude = region?.longitude;
  const latitudeDelta = region?.latitudeDelta;
  const longitudeDelta = region?.longitudeDelta;

  const zoom = useMemo(() => {
    const z = regionToZoom(region, viewportWidth);
    return Number.isFinite(z) && z > 0 ? Math.round(z) : 11;
  }, [region, viewportWidth]);

  const viewport = useMemo(() => {
    const vp = createMapViewport({ latitude, longitude, latitudeDelta, longitudeDelta });
    if (!vp) return null;
    return { ...vp, zoom };
  }, [latitude, longitude, latitudeDelta, longitudeDelta, zoom]);

  const [debouncedViewport, setDebouncedViewport] = useState(viewport);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedViewport(viewport), MAP_VIEWPORT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [viewport]);

  return useQuery({
    queryKey: ["places", "v2", "map", debouncedViewport],
    queryFn: ({ signal }) => getMapPlacesApi(debouncedViewport, signal),
    enabled: isValidMapViewport(debouncedViewport),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...getMapPlacesQueryOptions(),
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
