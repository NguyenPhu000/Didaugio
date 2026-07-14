export const MARKER_DENSITY = Object.freeze({
  CATEGORY: "category",
  DETAIL: "detail",
});

export function getMarkerDensity(zoom) {
  const value = Number(zoom);

  if (!Number.isFinite(value) || value < 13) {
    return MARKER_DENSITY.CATEGORY;
  }

  return MARKER_DENSITY.DETAIL;
}

export function regionToZoom(region, viewportWidth) {
  const longitudeDelta = Number(region?.longitudeDelta);
  const width = Number(viewportWidth);

  if (!Number.isFinite(longitudeDelta) || longitudeDelta <= 0) return 0;
  if (!Number.isFinite(width) || width <= 0) return 0;

  const angle = longitudeDelta * (width / 256);
  return Math.log2(360 / angle);
}

export function shouldShowMarkerLabelsForRegion(
  region,
  viewportWidth,
  threshold = 15,
) {
  return regionToZoom(region, viewportWidth) >= threshold;
}
