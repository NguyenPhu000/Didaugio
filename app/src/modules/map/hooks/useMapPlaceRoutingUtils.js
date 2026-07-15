export function buildRouteEndpointFromLocation(location, fallbackName) {
  if (
    !location ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    return null;
  }

  return {
    lat: location.latitude,
    lng: location.longitude,
    name: location.name || fallbackName,
  };
}

export function buildRouteEndpointFromPlace(place, fallbackName) {
  if (
    !place ||
    !Number.isFinite(Number(place.latitude)) ||
    !Number.isFinite(Number(place.longitude))
  ) {
    return null;
  }

  return {
    lat: Number(place.latitude),
    lng: Number(place.longitude),
    name: place.name || fallbackName,
  };
}
