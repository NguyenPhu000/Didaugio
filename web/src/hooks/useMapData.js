import { useState, useEffect, useMemo } from "react";
import * as turf from "@turf/turf";

export const useMapData = () => {
  const [districts, setDistricts] = useState(null);
  const [wards, setWards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canThoMask, setCanThoMask] = useState(null);

  // Fetch GeoJSON data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [districtsRes, wardsRes] = await Promise.all([
          fetch("/data/cantho_districts.geojson"),
          fetch("/data/cantho_wards.geojson"),
        ]);

        if (!districtsRes.ok || !wardsRes.ok) {
          throw new Error("Failed to load map boundary data");
        }

        const districtsData = await districtsRes.json();
        const wardsData = await wardsRes.json();

        setDistricts(districtsData);
        setWards(wardsData);
      } catch (err) {
        console.error("Error loading map data:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Generate Mask (Inverted Polygon)
  // We create a large "World" polygon and subtract the Unions of all Can Tho Districts
  useEffect(() => {
    if (!districts) return;

    // Run this calculation in a timeout or worker to avoid blocking UI if it's heavy
    // But for 9 districts it should be fast enough.
    const generateMask = () => {
      try {
        // 1. Create a large polygon covering the whole world
        const worldPolygon = turf.polygon([
          [
            [-180, -90],
            [180, -90],
            [180, 90],
            [-180, 90],
            [-180, -90],
          ],
        ]);

        // 2. Union all district polygons to get the outline of Can Tho
        let canThoPolygon = null;

        // Iterate features to merge
        // Note: districts.features might contain MultiPolygons
        turf.featureEach(districts, (currentFeature) => {
          if (!canThoPolygon) {
            canThoPolygon = currentFeature;
          } else {
            // turf.union handles Polygon/MultiPolygon merging
            try {
              canThoPolygon = turf.union(
                turf.featureCollection([canThoPolygon, currentFeature])
              );
            } catch (e) {
              console.warn("Union failed for a district", e);
            }
          }
        });

        if (canThoPolygon) {
          // 3. Subtract Can Tho from World
          const mask = turf.difference(turf.featureCollection([worldPolygon, canThoPolygon]));
          setCanThoMask(mask);
        }
      } catch (e) {
        console.error("Error generating mask:", e);
      }
    };

    generateMask();
  }, [districts]);

  return {
    districts,
    wards,
    canThoMask,
    loading,
    error,
  };
};
