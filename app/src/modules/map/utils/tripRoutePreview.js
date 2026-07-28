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

const pickImageValue = (source) => {
  if (typeof source === "string") return source;
  if (!source || typeof source !== "object") return null;
  return (
    source.secureUrl ||
    source.secure_url ||
    source.thumbnailUrl ||
    source.thumbnail_url ||
    source.imageUrl ||
    source.image_url ||
    source.imageData ||
    source.image_data ||
    source.mediaData ||
    source.media_data ||
    source.url ||
    source.uri ||
    null
  );
};

const resolvePlaceThumbnail = (place) => {
  if (!place || typeof place !== "object") return null;
  const firstImage = Array.isArray(place.images) ? place.images[0] : null;
  return (
    pickImageValue(firstImage) ||
    place.markerImageUri ||
    place.marker_image_uri ||
    place.markerUrl ||
    place.marker_url ||
    place.secureUrl ||
    place.secure_url ||
    place.thumbnailUrl ||
    place.thumbnail_url ||
    place.thumbnail ||
    place.imageUrl ||
    place.image_url ||
    place.imageData ||
    place.image_data ||
    place.mediaData ||
    place.media_data ||
    place.image ||
    place.coverImage ||
    place.cover_image ||
    place.coverUrl ||
    place.cover_url ||
    place.photoUrl ||
    place.photo_url ||
    place.url ||
    place.uri ||
    null
  );
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
      const thumbnailUri =
        resolvePlaceThumbnail(place) ||
        destination.thumbnail ||
        place.thumbnail ||
        place.thumbnailUrl ||
        place.imageUrl ||
        null;
      return {
        id: destination.id,
        placeId: place.id,
        name: place.name,
        thumbnail: thumbnailUri,
        place,
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

export function calculateBearing(lat1, lon1, lat2, lon2) {
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(radLat2);
  const x =
    Math.cos(radLat1) * Math.sin(radLat2) -
    Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((brng + 360) % 360);
}

const getSegmentMidpointAndBearing = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return { coordinate: null, bearing: 0 };
  }
  if (coordinates.length === 1) {
    return { coordinate: coordinates[0], bearing: 0 };
  }
  const midIndex = Math.floor((coordinates.length - 1) / 2);
  const p1 = coordinates[midIndex];
  const p2 = coordinates[midIndex + 1] || coordinates[midIndex];

  const bearing = calculateBearing(
    p1.latitude,
    p1.longitude,
    p2.latitude,
    p2.longitude,
  );

  return { coordinate: p1, bearing };
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

    const { coordinate: labelCoordinate, bearing } =
      getSegmentMidpointAndBearing(coordinates);

    segments.push({
      id: `${from.sequence}-${to.sequence}`,
      from,
      to,
      label: `${from.sequence}-${to.sequence}`,
      distanceM,
      distanceLabel: formatPreviewDistance(distanceM),
      coordinates,
      labelCoordinate,
      bearing,
      color: TRIP_PREVIEW_SEGMENT_COLORS[index % TRIP_PREVIEW_SEGMENT_COLORS.length],
      source: route.source || "fallback",
      dashed: route.source === "fallback" && route.coordinates?.length >= 2,
    });
  }
  return segments;
}
