import { distanceMeters } from "./distance";

export const TRIP_PREVIEW_SEGMENT_COLORS = Object.freeze([
  "#EF4444",
  "#06B6D4",
  "#8B5CF6",
  "#F59E0B",
  "#10B981",
  "#EC4899",
  "#3B82F6",
]);

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const toCoordinate = (place) => {
  const latitude = toNumber(place?.latitude);
  const longitude = toNumber(place?.longitude);
  if (latitude === null || longitude === null) return null;
  return { latitude, longitude };
};

const compareDestinationOrder = (a, b) => {
  const dayDelta = Number(a?.dayNumber || 1) - Number(b?.dayNumber || 1);
  if (dayDelta !== 0) return dayDelta;
  const orderDelta = Number(a?.order || 0) - Number(b?.order || 0);
  if (orderDelta !== 0) return orderDelta;
  return Number(a?.id || 0) - Number(b?.id || 0);
};

export function buildTripPreviewStops(destinations = []) {
  return [...destinations]
    .sort(compareDestinationOrder)
    .map((destination) => {
      const place = destination?.place;
      const coordinate = toCoordinate(place);
      if (!place || !coordinate) return null;
      return {
        id: destination.id,
        placeId: place.id,
        name: place.name,
        thumbnail: place.thumbnail,
        destination,
        coordinate,
      };
    })
    .filter(Boolean)
    .map((stop, index) => ({
      ...stop,
      sequence: index + 1,
    }));
}

const getMidpointCoordinate = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return null;
  return coordinates[Math.floor((coordinates.length - 1) / 2)] ?? null;
};

const formatPreviewDistance = (meters) => {
  const total = Number(meters);
  if (!Number.isFinite(total) || total <= 0) return null;
  if (total < 1000) return `${Math.round(total)} m`;
  const roundedKm = Math.round((total / 1000) * 10) / 10;
  return `${roundedKm.toFixed(1).replace(/\.0$/, "")} km`;
};

export function buildTripPreviewSegments(stops = [], routeResults = []) {
  const segments = [];
  for (let index = 0; index < stops.length - 1; index += 1) {
    const from = stops[index];
    const to = stops[index + 1];
    const route = routeResults[index] || {};
    const fallbackCoordinates = [from.coordinate, to.coordinate];
    const coordinates =
      Array.isArray(route.coordinates) && route.coordinates.length >= 2
        ? route.coordinates
        : fallbackCoordinates;
    const distanceM = Number.isFinite(Number(route.distanceM))
      ? Number(route.distanceM)
      : distanceMeters(
          from.coordinate.latitude,
          from.coordinate.longitude,
          to.coordinate.latitude,
          to.coordinate.longitude,
        );

    segments.push({
      id: `${from.sequence}-${to.sequence}`,
      from,
      to,
      label: `${from.sequence}-${to.sequence}`,
      distanceM,
      distanceLabel: formatPreviewDistance(distanceM),
      coordinates,
      labelCoordinate: getMidpointCoordinate(coordinates),
      color: TRIP_PREVIEW_SEGMENT_COLORS[index % TRIP_PREVIEW_SEGMENT_COLORS.length],
      source: route.source || "fallback",
      dashed: route.source === "fallback" && route.coordinates?.length >= 2,
    });
  }
  return segments;
}
