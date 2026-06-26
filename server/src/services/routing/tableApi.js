import fetch from "node-fetch";
import NodeCache from "node-cache";
import logger from "../../config/logger.js";

const OSRM_URL = process.env.OSRM_URL || "http://localhost:5000";
const TABLE_TIMEOUT_MS = Number(process.env.ROUTING_TABLE_TIMEOUT_MS || 8000);
const MAX_TABLE_POINTS = 100;
const TABLE_CACHE_TTL = Number(process.env.TABLE_CACHE_TTL_SEC || 120);

const tableCache = new NodeCache({ stdTTL: TABLE_CACHE_TTL, useClones: false });

function mapModeToProfile(mode) {
  const map = { driving: "driving", motorcycle: "driving", walking: "foot", cycling: "bike" };
  return map[mode] || "driving";
}

function buildTableCacheKey(points, mode, options) {
  const coords = points
    .map((p) => `${Number(p.lat).toFixed(6)},${Number(p.lng).toFixed(6)}`)
    .join(";");
  const optStr = options.exclude ? `:ex=${options.exclude}` : "";
  return `table:${mode}:${coords}${optStr}`;
}

export async function calculateTable(points, mode = "driving", options = {}) {
  if (!Array.isArray(points) || points.length < 2) {
    throw new Error("Cần tối thiểu 2 điểm cho table calculation");
  }
  if (points.length > MAX_TABLE_POINTS) {
    throw new Error(`Tối đa ${MAX_TABLE_POINTS} điểm cho table calculation`);
  }

  // Check cache
  const cacheKey = buildTableCacheKey(points, mode, options);
  const cached = tableCache.get(cacheKey);
  if (cached) return cached;

  const profile = mapModeToProfile(mode);
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `${OSRM_URL}/table/v1/${profile}/${coords}`;
  const params = new URLSearchParams({ annotations: "duration,distance" });

  if (options.exclude) {
    params.append("exclude", options.exclude);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TABLE_TIMEOUT_MS);

  try {
    const res = await fetch(`${url}?${params.toString()}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`OSRM Table HTTP ${res.status}`);
    const data = await res.json();
    if (data.code !== "Ok") throw new Error(`OSRM Table ${data.code}: ${data.message || "Unknown"}`);
    const result = {
      distances: data.distances || [],
      durations: data.durations || [],
      sources: data.sources || [],
      destinations: data.destinations || [],
    };
    tableCache.set(cacheKey, result);
    return result;
  } catch (error) {
    logger.warn("[tableApi] OSRM Table API failed", { error: error.message, pointCount: points.length });
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function calculateSequentialLegs(waypoints, mode = "driving", options = {}) {
  if (waypoints.length < 2) return { legs: [], totalDistance: 0, totalDuration: 0 };

  // Use Table API for up to MAX_TABLE_POINTS waypoints (batch is always more efficient)
  try {
    const table = await calculateTable(waypoints, mode, options);
    const legs = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const distance = table.distances[i]?.[i + 1] ?? null;
      const duration = table.durations[i]?.[i + 1] ?? null;
      if (distance === null || duration === null) throw new Error(`Missing table data for leg ${i}`);
      legs.push({ index: i + 1, from: waypoints[i], to: waypoints[i + 1], distance, duration, source: "table" });
    }
    const totalDistance = legs.reduce((sum, leg) => sum + leg.distance, 0);
    const totalDuration = legs.reduce((sum, leg) => sum + leg.duration, 0);
    return { legs, totalDistance, totalDuration, source: "table" };
  } catch (error) {
    logger.warn("[tableApi] Table API failed, falling back to pairwise", { error: error.message });
  }
  return null;
}
