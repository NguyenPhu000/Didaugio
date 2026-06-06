/**
 * useRouting — Phase 1 routing hook
 * Uses the public OSRM demo server (no API key needed).
 * For production, swap OSRM_BASE to a self-hosted or VietMap routing instance.
 */
import { useState, useCallback, useRef } from "react";
import i18n from "@/i18n";

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds) {
  const t = i18n.t.bind(i18n);
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} ${t("map.routing.minutes")}`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  const hr = `${h} ${t("map.routing.hours")}`;
  return rem ? `${hr} ${rem} ${t("map.routing.minutes")}` : hr;
}

export function useRouting() {
  const [origin, setOriginState] = useState(null); // { lat, lng, name }
  const [destination, setDestinationState] = useState(null); // { lat, lng, name }
  const [route, setRoute] = useState(null); // GeoJSON Feature (LineString)
  const [routeInfo, setRouteInfo] = useState(null); // { distance, duration, distanceLabel, durationLabel }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /** Keep latest origin in a ref so setDestination can read it without stale closure */
  const originRef = useRef(null);

  const fetchRoute = useCallback(async (from, to) => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    setRoute(null);
    setRouteInfo(null);

    try {
      const url =
        `${OSRM_BASE}/${from.lng},${from.lat};${to.lng},${to.lat}` +
        `?overview=full&geometries=geojson&steps=false`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.code !== "Ok" || !data.routes?.length) {
        throw new Error(i18n.t("map.routing.routeNotFound"));
      }

      const r = data.routes[0];
      setRoute({
        type: "Feature",
        geometry: r.geometry,
        properties: {},
      });
      setRouteInfo({
        distance: r.distance,
        duration: r.duration,
        distanceLabel: formatDistance(r.distance),
        durationLabel: formatDuration(r.duration),
      });
    } catch (e) {
      setError(e.message ?? i18n.t("map.routing.routingError"));
    } finally {
      setLoading(false);
    }
  }, []);

  const setOrigin = useCallback(
    (point) => {
      originRef.current = point;
      setOriginState(point);
      // Re-fetch if destination already set
      setDestinationState((prev) => {
        if (prev && point) fetchRoute(point, prev);
        return prev;
      });
    },
    [fetchRoute],
  );

  const setDestination = useCallback(
    (point) => {
      setDestinationState(point);
      if (originRef.current && point) fetchRoute(originRef.current, point);
    },
    [fetchRoute],
  );

  const clearRoute = useCallback(() => {
    originRef.current = null;
    setOriginState(null);
    setDestinationState(null);
    setRoute(null);
    setRouteInfo(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    origin,
    destination,
    route,
    routeInfo,
    loading,
    error,
    setOrigin,
    setDestination,
    fetchRoute,
    clearRoute,
  };
}
