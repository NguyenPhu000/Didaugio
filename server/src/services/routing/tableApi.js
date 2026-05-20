import fetch from "node-fetch";
import logger from "../../config/logger.js";

const OSRM_URL = process.env.OSRM_URL || "http://localhost:5000";
const TABLE_TIMEOUT_MS = Number(process.env.ROUTING_TABLE_TIMEOUT_MS || 8000);
const MAX_TABLE_POINTS = 50;

function mapModeToProfile(mode) {
  const map = { driving: "driving", motorcycle: "driving", walking: "foot", cycling: "bike" };
  return map[mode] || "driving";
}

export async function calculateTable(points, mode = "driving") {
  if (!Array.isArray(points) || points.length < 2) {
    throw new Error("Cần tối thiểu 2 điểm cho table calculation");
  }
  if (points.length > MAX_TABLE_POINTS) {
    throw new Error(`Tối đa ${MAX_TABLE_POINTS} điểm cho table calculation`);
  }

  const profile = mapModeToProfile(mode);
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `${OSRM_URL}/table/v1/${profile}/${coords}`;
  const params = new URLSearchParams({ annotations: "duration,distance" });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TABLE_TIMEOUT_MS);

  try {
    const res = await fetch(`${url}?${params.toString()}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`OSRM Table HTTP ${res.status}`);
    const data = await res.json();
    if (data.code !== "Ok") throw new Error(`OSRM Table ${data.code}: ${data.message || "Unknown"}`);
    return {
      distances: data.distances || [],
      durations: data.durations || [],
      sources: data.sources || [],
      destinations: data.destinations || [],
    };
  } catch (error) {
    logger.warn("[tableApi] OSRM Table API failed", { error: error.message, pointCount: points.length });
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function calculateSequentialLegs(waypoints, mode = "driving") {
  if (waypoints.length < 2) return { legs: [], totalDistance: 0, totalDuration: 0 };
  if (waypoints.length <= 10) {
    try {
      const table = await calculateTable(waypoints, mode);
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
  }
  return null;
}
