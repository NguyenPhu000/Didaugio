import * as turf from "@turf/turf";

/** Module-level cache keyed by feature count + first feature id to detect data changes */
let _maskCache = { key: null, result: null };

const makeCacheKey = (features) =>
  `${features.length  }:${  features[0]?.properties?.id ?? ""}`;

/**
 * Generate a "fog" mask polygon that covers the entire world
 * EXCEPT the Can Tho region (union of all district polygons).
 *
 * Returns null if districts don't have polygon geometry.
 * Result is cached at module level — only recomputed when data changes.
 */
export const generateCanThoMask = (districtsGeoJSON) => {
  if (!districtsGeoJSON?.features?.length) return null;

  const cacheKey = makeCacheKey(districtsGeoJSON.features);
  if (_maskCache.key === cacheKey) return _maskCache.result;

  // Only works with Polygon/MultiPolygon features (not Point)
  const polygonFeatures = districtsGeoJSON.features.filter(
    (f) =>
      f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon",
  );

  if (polygonFeatures.length === 0) {
    _maskCache = { key: cacheKey, result: null };
    return null;
  }

  let result = null;
  try {
    const worldPolygon = turf.polygon([
      [
        [-180, -90],
        [180, -90],
        [180, 90],
        [-180, 90],
        [-180, -90],
      ],
    ]);

    let canThoPolygon = null;

    for (const feature of polygonFeatures) {
      if (!canThoPolygon) {
        canThoPolygon = feature;
      } else {
        try {
          canThoPolygon = turf.union(
            turf.featureCollection([canThoPolygon, feature]),
          );
        } catch (e) {
          console.warn("[geoUtils] Union failed for a district:", e);
        }
      }
    }

    if (canThoPolygon) {
      result = turf.difference(
        turf.featureCollection([worldPolygon, canThoPolygon]),
      );
    }
  } catch (e) {
    console.error("[geoUtils] Error generating mask:", e);
  }

  _maskCache = { key: cacheKey, result };
  return result;
};
