const MIN_HEATMAP_SPAN = 0.015;

export function normalizeHeatmapPoints(points) {
  if (!Array.isArray(points)) return [];

  return points.flatMap((point) => {
    const lat = Number(point?.lat);
    const lng = Number(point?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];

    const weight = Number(point.weight);
    return [{
      ...point,
      lat,
      lng,
      weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
    }];
  });
}

export function getHeatmapBounds(points) {
  const validPoints = normalizeHeatmapPoints(points);
  if (validPoints.length === 0) return null;

  const latitudes = validPoints.map((point) => point.lat);
  const longitudes = validPoints.map((point) => point.lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latSpan = Math.max(maxLat - minLat, MIN_HEATMAP_SPAN);
  const lngSpan = Math.max(maxLng - minLng, MIN_HEATMAP_SPAN);

  return [
    [minLng - (lngSpan - (maxLng - minLng)) / 2, minLat - (latSpan - (maxLat - minLat)) / 2],
    [maxLng + (lngSpan - (maxLng - minLng)) / 2, maxLat + (latSpan - (maxLat - minLat)) / 2],
  ];
}
