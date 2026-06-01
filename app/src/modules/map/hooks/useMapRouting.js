import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  calculateRouteApi,
  calculateRouteLegsApi,
} from "../../../api/routingApi";
import { mapRoutingResponse } from "./routeMapping";

const STALE_TIME = 5 * 60 * 1000; // 5 phút — khớp với NodeCache TTL phía server

/**
 * Làm tròn tọa độ 4 chữ số thập phân để tối ưu cache.
 */
const roundCoord = (value) =>
  typeof value === "number" ? Number(value.toFixed(4)) : value;

const normalizePoint = (point) => {
  if (!point) return null;
  return {
    lat: roundCoord(Number(point.lat ?? point.latitude)),
    lng: roundCoord(Number(point.lng ?? point.longitude)),
    ...(point.name ? { name: point.name } : {}),
  };
};

const isValidPoint = (point) =>
  point &&
  Number.isFinite(point.lat) &&
  Number.isFinite(point.lng) &&
  Math.abs(point.lat) <= 90 &&
  Math.abs(point.lng) <= 180;

const DEFAULT_ROUTE_OPTIONS = {
  alternatives: 1,
  steps: true,
  overview: "full",
  geometries: "polyline6",
  snapToRoad: true,
  simplifyGeometry: true,
};

/**
 * Hook tính route 2 điểm — dùng trong MapScreen / directions flow.
 *
 * @param {{ origin, destination, mode?, options?, enabled? }} params
 */
export function useMapRouting({
  origin,
  destination,
  mode = "driving",
  options = {},
  enabled = true,
} = {}) {
  const normalizedOrigin = useMemo(() => normalizePoint(origin), [origin]);
  const normalizedDestination = useMemo(
    () => normalizePoint(destination),
    [destination],
  );

  const isReady =
    enabled &&
    isValidPoint(normalizedOrigin) &&
    isValidPoint(normalizedDestination);

  const queryKey = useMemo(
    () => ["route", normalizedOrigin, normalizedDestination, mode, options],
    [normalizedDestination, normalizedOrigin, mode, options],
  );

  const query = useQuery({
    queryKey,
    queryFn: () =>
      calculateRouteApi({
        origin: normalizedOrigin,
        destination: normalizedDestination,
        mode,
        options: {
          alternatives: 1,
          steps: true,
          overview: "full",
          geometries: "polyline6",
          snapToRoad: true,
          simplifyGeometry: true,
          ...options,
        },
      }),
    enabled: isReady,
    staleTime: STALE_TIME,
    gcTime: STALE_TIME * 2,
    retry: 1,
    select: mapRoutingResponse,
  });

  return {
    coordinates: query.data?.coordinates ?? [],
    firstRoute: query.data?.firstRoute ?? null,
    routes: query.data?.routes ?? [],
    source: query.data?.source ?? null,
    isFallback: query.data?.isFallback ?? false,
    ferryAvoidanceFailed: query.data?.ferryAvoidanceFailed ?? false,
    distanceM: query.data?.distanceM ?? null,
    durationS: query.data?.durationS ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook tính legs giữa nhiều waypoints — dùng trong Trip Detail / AI Planner.
 *
 * @param {{ waypoints, mode?, options?, enabled? }} params
 */
export function useRoutingLegs({
  waypoints = [],
  mode = "driving",
  options = {},
  enabled = true,
} = {}) {
  const normalizedWaypoints = useMemo(
    () => waypoints.map(normalizePoint).filter(isValidPoint),
    [waypoints],
  );

  const isReady = enabled && normalizedWaypoints.length >= 2;

  const queryKey = useMemo(
    () => ["route-legs", normalizedWaypoints, mode, options],
    [normalizedWaypoints, mode, options],
  );

  const query = useQuery({
    queryKey,
    queryFn: () =>
      calculateRouteLegsApi({
        waypoints: normalizedWaypoints,
        mode,
        options: {
          simplifyGeometry: true,
          ...options,
        },
      }),
    enabled: isReady,
    staleTime: STALE_TIME,
    gcTime: STALE_TIME * 2,
    retry: 1,
    select: (response) => response?.data ?? null,
  });

  return {
    legsData: query.data,
    totalDistance: query.data?.totalDistance ?? null,
    totalDuration: query.data?.totalDuration ?? null,
    legs: query.data?.legs ?? [],
    ferryAvoidanceFailed: query.data?.ferryAvoidanceFailed ?? false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
