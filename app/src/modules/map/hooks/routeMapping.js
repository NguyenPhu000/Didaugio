/**
 * Decode polyline6 (Encoded Polyline Algorithm, precision 6).
 */
export const decodePoly6 = (encoded) => {
  if (!encoded || typeof encoded !== "string") return [];
  const coords = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coords.push({ latitude: lat / 1e6, longitude: lng / 1e6 });
  }

  return coords;
};

/**
 * Chuyển geometry (polyline6 string hoặc GeoJSON) thành
 * mảng [{latitude, longitude}] tương thích react-native-maps.
 */
export const geometryToCoordinates = (geometry) => {
  if (!geometry) return [];

  if (
    typeof geometry === "object" &&
    geometry.type === "LineString" &&
    Array.isArray(geometry.coordinates)
  ) {
    return geometry.coordinates.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));
  }

  if (Array.isArray(geometry)) {
    if (geometry.length === 0) return [];
    if (Array.isArray(geometry[0])) {
      return geometry.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
    }
    if (typeof geometry[0] === "object" && "lat" in geometry[0]) {
      return geometry.map((p) => ({ latitude: p.lat, longitude: p.lng }));
    }
  }

  if (typeof geometry === "string") {
    return decodePoly6(geometry);
  }

  return [];
};

export const mapRoutingResponse = (response) => {
  const routeData = response?.data;
  const firstRoute = routeData?.routes?.[0] ?? null;
  const coordinates = firstRoute
    ? geometryToCoordinates(firstRoute.geometry)
    : [];

  return {
    source: routeData?.source ?? "unknown",
    routes: routeData?.routes ?? [],
    firstRoute,
    coordinates,
    isFallback: routeData?.source === "fallback",
    ferryAvoidanceFailed: routeData?.ferryAvoidanceFailed ?? false,
    distanceM: firstRoute?.distance ?? null,
    durationS: firstRoute?.duration ?? null,
  };
};
