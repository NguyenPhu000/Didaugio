import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL } from "@/constants/constants";
import { MAP_API_PATHS } from "../config/mapConfig";
import { generateCanThoMask } from "../utils/geoUtils";

export const useMapData = () => {
  const [districts, setDistricts] = useState(null);
  const [wards, setWards] = useState(null);
  const [canThoMask, setCanThoMask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

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

      // API wraps response in {success, data, message} envelope — unwrap
      const districtsGeoJSON = districtsData.data ?? districtsData;
      const wardsGeoJSON = wardsData.data ?? wardsData;

      setDistricts(districtsGeoJSON);
      setWards(wardsGeoJSON);

      const mask = generateCanThoMask(districtsGeoJSON);
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
  }, []);

  useEffect(() => {
    fetchData();
    return () => controllerRef.current?.abort();
  }, [fetchData]);

  return { districts, wards, canThoMask, loading, error, retry: fetchData };
};
