export function mapTripCacheValue(cacheValue, mapper) {
  if (!cacheValue) return cacheValue;

  if (cacheValue.data && typeof cacheValue.data === "object") {
    return {
      ...cacheValue,
      data: mapper(cacheValue.data),
    };
  }

  return mapper(cacheValue);
}

export function getTripCacheDestinations(trip) {
  return Array.isArray(trip?.destinations) ? trip.destinations : [];
}
