// Mức hiển thị marker theo zoom:
// - CATEGORY (zoom < 10): icon theo danh mục để map vẫn dễ đọc.
// - IMAGE    (10 ≤ zoom < 13): ảnh marker kèm tên địa điểm.
// - DETAIL   (zoom ≥ 13): ảnh marker kèm tên địa điểm.
export const MARKER_DENSITY = Object.freeze({
  CATEGORY: "category",
  IMAGE: "image",
  DETAIL: "detail",
});

// Ngưỡng zoom cho từng mức.
export const MARKER_DENSITY_THRESHOLDS = Object.freeze({
  IMAGE_MIN: 10,
  DETAIL_MIN: 13,
});

export function getMarkerDensity(zoom) {
  const value = Number(zoom);
  if (!Number.isFinite(value) || value < MARKER_DENSITY_THRESHOLDS.IMAGE_MIN) {
    return MARKER_DENSITY.CATEGORY;
  }
  if (value < MARKER_DENSITY_THRESHOLDS.DETAIL_MIN) {
    return MARKER_DENSITY.IMAGE;
  }
  return MARKER_DENSITY.DETAIL;
}

export function getMarkerPresentation(density, markerImageUri) {
  return {
    density,
    imageUri:
      density !== MARKER_DENSITY.CATEGORY && typeof markerImageUri === "string"
        ? markerImageUri
        : null,
    showLabel: density !== MARKER_DENSITY.CATEGORY,
  };
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
  threshold = MARKER_DENSITY_THRESHOLDS.DETAIL_MIN,
) {
  return regionToZoom(region, viewportWidth) >= threshold;
}
