import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/constants/constants";
import { MAP_API_PATHS } from "../config/mapConfig";
import { generateCanThoMask } from "../utils/geoUtils";

/**
 * useMapData — Fetches boundary GeoJSON from the API (DB-backed).
 * Replaces the old static-file approach.
 */
export const useMapData = () => {
  const [districts, setDistricts] = useState(null);
  const [wards, setWards] = useState(null);
  const [canThoMask, setCanThoMask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [districtsRes, wardsRes] = await Promise.all([
          fetch(`${API_BASE_URL}${MAP_API_PATHS.DISTRICTS_GEOJSON}`, {
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}${MAP_API_PATHS.WARDS_GEOJSON}`, {
            signal: controller.signal,
          }),
        ]);

        if (!districtsRes.ok || !wardsRes.ok) {
          throw new Error("Failed to fetch boundary data from API");
        }

        const districtsData = await districtsRes.json();
        const wardsData = await wardsRes.json();

        setDistricts(districtsData);
        setWards(wardsData);

        // Generate mask only if district data has polygon geometry
        const mask = generateCanThoMask(districtsData);
        setCanThoMask(mask);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("[useMapData] Error:", err);
          setError(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => controller.abort();
  }, []);

  return { districts, wards, canThoMask, loading, error };
};
