export function buildTripPreviewRouteRequest({ from, to, resolveMode }) {
  return {
    origin: {
      lat: from.coordinate.latitude,
      lng: from.coordinate.longitude,
      name: from.name,
    },
    destination: {
      lat: to.coordinate.latitude,
      lng: to.coordinate.longitude,
      name: to.name,
    },
    mode: resolveMode(from.destination?.transportToNext),
    options: {
      alternatives: 1,
      steps: false,
      overview: "full",
      geometries: "polyline6",
      snapToRoad: true,
      simplifyGeometry: true,
    },
  };
}
