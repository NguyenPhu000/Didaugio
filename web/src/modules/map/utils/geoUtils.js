import * as turf from "@turf/turf";

/**
 * Generate a "fog" mask polygon that covers the entire world
 * EXCEPT the Can Tho region (union of all district polygons).
 *
 * Returns null if districts don't have polygon geometry.
 */
export const generateCanThoMask = (districtsGeoJSON) => {
  if (!districtsGeoJSON?.features?.length) return null;

  // Only works with Polygon/MultiPolygon features (not Point)
  const polygonFeatures = districtsGeoJSON.features.filter(
    (f) =>
      f.geometry?.type === "Polygon" || f.geometry?.type === "MultiPolygon",
  );

  if (polygonFeatures.length === 0) return null;

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
      return turf.difference(
        turf.featureCollection([worldPolygon, canThoPolygon]),
      );
    }
  } catch (e) {
    console.error("[geoUtils] Error generating mask:", e);
  }

  return null;
};
