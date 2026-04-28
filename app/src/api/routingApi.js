import apiClient from "./client";
import { ENDPOINTS } from "./endpoints";

/**
 * Tính route giữa 2 điểm (origin -> destination, optional waypoints).
 * @param {{ origin, destination, waypoints?, mode?, options? }} payload
 */
export const calculateRouteApi = async (payload) => {
  const response = await apiClient.post(ENDPOINTS.routing.calculate, payload);
  return response;
};

/**
 * Tính từng chặng (legs) giữa một mảng waypoints.
 * @param {{ waypoints, mode?, options? }} payload
 */
export const calculateRouteLegsApi = async (payload) => {
  const response = await apiClient.post(ENDPOINTS.routing.legs, payload);
  return response;
};

/**
 * AI navigation — phân tích các routes và gợi ý tuyến tốt nhất.
 * @param {{ origin, destination, routes, context? }} payload
 */
export const aiNavigateApi = async (payload) => {
  const response = await apiClient.post(ENDPOINTS.ai.navigate, payload);
  return response;
};

/**
 * Orchestrated navigation — AI xếp waypoint, OSRM dựng geometry cuối.
 * @param {{ origin, destination, waypoints?, mode?, options?, context? }} payload
 */
export const orchestrateNavigationApi = async (payload) => {
  const response = await apiClient.post(ENDPOINTS.navigation.navigate, payload);
  return response;
};

/**
 * Gửi telemetry điều hướng để đo route deviation/reroute quality.
 * @param {{ sessionId?, meta?, events: Array }} payload
 */
export const sendNavigationTelemetryApi = async (payload) => {
  const response = await apiClient.post(ENDPOINTS.navigation.telemetry, payload);
  return response;
};

/**
 * Kiểm tra health của routing service (OSRM + fallback).
 */
export const getRoutingHealthApi = async () => {
  const response = await apiClient.get(ENDPOINTS.routing.health);
  return response;
};
