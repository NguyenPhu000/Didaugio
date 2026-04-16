export function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Haversine distance in meters.
export function distanceMeters(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const lat1 = Number(a.latitude);
  const lon1 = Number(a.longitude);
  const lat2 = Number(b.latitude);
  const lon2 = Number(b.longitude);

  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) {
    return Number.POSITIVE_INFINITY;
  }

  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLon / 2);
  const h =
    s1 * s1 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * (s2 * s2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistance(meters) {
  const m = Number(meters);
  if (!Number.isFinite(m) || m <= 0) return null;
  if (m < 1000) return `${Math.round(m)} m`;
  const km = m / 1000;
  return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
}

