const BOUNDS_PRECISION = 4;

const roundBound = (value) =>
  Number(Number(value).toFixed(BOUNDS_PRECISION));

export function createMapViewport(region) {
  const latitude = Number(region?.latitude);
  const longitude = Number(region?.longitude);
  const latitudeDelta = Number(region?.latitudeDelta);
  const longitudeDelta = Number(region?.longitudeDelta);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitudeDelta) ||
    !Number.isFinite(longitudeDelta) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    latitudeDelta <= 0 ||
    longitudeDelta <= 0
  ) {
    return null;
  }

  const halfLatitudeDelta = latitudeDelta / 2;
  const halfLongitudeDelta = longitudeDelta / 2;
  const south = latitude - halfLatitudeDelta;
  const north = latitude + halfLatitudeDelta;
  const west = longitude - halfLongitudeDelta;
  const east = longitude + halfLongitudeDelta;

  if (south < -90 || north > 90 || west < -180 || east > 180) {
    return null;
  }

  return {
    west: roundBound(west),
    south: roundBound(south),
    east: roundBound(east),
    north: roundBound(north),
  };
}
