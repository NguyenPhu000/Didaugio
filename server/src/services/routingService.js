import fetch from "node-fetch";
import NodeCache from "node-cache";
import ServiceError from "../utils/serviceError.js";

const DEFAULT_TIMEOUT_MS = Number(process.env.ROUTING_TIMEOUT_MS || 4500);
const DEFAULT_TTL_SEC = Number(process.env.ROUTE_CACHE_TTL_SEC || 300);
const OSRM_URL = process.env.OSRM_URL || "http://localhost:5000";

const SPEED_KMH_BY_MODE = {
  driving: 30,
  motorcycle: 32,
  walking: 4.8,
  cycling: 14,
};

class RoutingService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: DEFAULT_TTL_SEC, useClones: false });
    this.metrics = {
      totalRequests: 0,
      fallbackRequests: 0,
      consecutiveFailures: 0,
      lastSuccessAt: null,
      lastFailureAt: null,
      lastFailureMessage: null,
    };
  }

  async calculate(payload = {}) {
    const {
      origin,
      destination,
      waypoints = [],
      mode = "driving",
      options = {},
    } = payload;

    const snapToRoad = options?.snapToRoad !== false;

    const points = [origin, ...waypoints, destination];
    const cacheKey = this._buildCacheKey(points, mode, options);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    this.metrics.totalRequests += 1;

    try {
      const effectivePoints = snapToRoad
        ? await this._snapPoints(points, mode)
        : points;

      let osrmResponse;
      try {
        osrmResponse = await this._callOsrm(effectivePoints, mode, options);
      } catch (firstError) {
        // Nếu snap lỗi theo ngữ cảnh cụ thể, thử lại với tọa độ gốc.
        if (!snapToRoad) throw firstError;
        osrmResponse = await this._callOsrm(points, mode, options);
      }

      const normalized = this._normalizeRouteResponse(osrmResponse, "osrm");

      this.cache.set(cacheKey, normalized);
      this.metrics.consecutiveFailures = 0;
      this.metrics.lastSuccessAt = new Date().toISOString();
      return normalized;
    } catch (error) {
      this.metrics.consecutiveFailures += 1;
      this.metrics.fallbackRequests += 1;
      this.metrics.lastFailureAt = new Date().toISOString();
      this.metrics.lastFailureMessage = error?.message || "OSRM failed";

      const fallback = this._buildFallbackResponse(points, mode);
      this.cache.set(cacheKey, fallback);
      return fallback;
    }
  }

  async calculateLegs(payload = {}) {
    const { waypoints = [], mode = "driving", options = {} } = payload;

    if (!Array.isArray(waypoints) || waypoints.length < 2) {
      throw new ServiceError(
        "Cần tối thiểu 2 waypoint để tính legs",
        400,
        "VALIDATION_ERROR",
      );
    }

    const legs = [];
    let totalDistance = 0;
    let totalDuration = 0;

    for (let i = 0; i < waypoints.length - 1; i += 1) {
      const from = waypoints[i];
      const to = waypoints[i + 1];
      const result = await this.calculate({
        origin: from,
        destination: to,
        mode,
        options: { ...options, alternatives: 0 },
      });

      const firstRoute = result.routes?.[0] || null;
      if (!firstRoute) continue;

      totalDistance += Number(firstRoute.distance || 0);
      totalDuration += Number(firstRoute.duration || 0);

      legs.push({
        index: i + 1,
        from,
        to,
        source: result.source,
        route: firstRoute,
      });
    }

    return {
      source: legs.some((leg) => leg.source === "fallback") ? "mixed" : "osrm",
      code: "Ok",
      totalDistance,
      totalDuration,
      legs,
    };
  }

  async getHealth() {
    const start = Date.now();
    let osrmReachable = false;
    let status = "degraded";
    let detail = "OSRM chưa phản hồi";

    try {
      await this._callOsrm(
        [
          { lng: 105.7200532, lat: 10.0345852 },
          { lng: 105.724, lat: 10.037 },
        ],
        "driving",
        { alternatives: 0, steps: false },
      );
      osrmReachable = true;
      status = "ok";
      detail = "OSRM khả dụng";
    } catch (error) {
      detail = error?.message || detail;
    }

    const latencyMs = Date.now() - start;
    const fallbackRate =
      this.metrics.totalRequests > 0
        ? Number(
            (
              this.metrics.fallbackRequests / this.metrics.totalRequests
            ).toFixed(4),
          )
        : 0;

    return {
      status,
      detail,
      osrmReachable,
      osrmLatencyMs: latencyMs,
      routingEngine: "osrm",
      fallbackRate,
      consecutiveFailures: this.metrics.consecutiveFailures,
      lastSuccessAt: this.metrics.lastSuccessAt,
      lastFailureAt: this.metrics.lastFailureAt,
      lastFailureMessage: this.metrics.lastFailureMessage,
      cache: {
        ttlSec: DEFAULT_TTL_SEC,
        keys: this.cache.keys().length,
      },
    };
  }

  async _callOsrm(points, mode, options = {}) {
    const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
    const profile = this._mapModeToOsrm(mode);

    const url = this._buildOsrmRouteUrl(profile, coords);
    const params = new URLSearchParams({
      alternatives: String(options.alternatives ?? 3),
      steps: String(options.steps ?? true),
      overview: options.overview || "full",
      geometries: options.geometries || "polyline6",
      annotations: "duration,distance",
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const res = await fetch(`${url}?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`OSRM HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.code !== "Ok") {
        throw new Error(`OSRM ${data.code}: ${data.message || "Unknown"}`);
      }

      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async _snapPoints(points = [], mode = "driving") {
    if (!Array.isArray(points) || points.length === 0) return [];

    const profile = this._mapModeToOsrm(mode);
    const snapped = await Promise.all(
      points.map((point) => this._snapPointToRoad(point, profile)),
    );

    return snapped;
  }

  async _snapPointToRoad(point = {}, profile = "driving") {
    const lat = Number(point?.lat);
    const lng = Number(point?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return point;
    }

    const url = this._buildOsrmNearestUrl(profile, { lat, lng });
    const params = new URLSearchParams({ number: "1" });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const res = await fetch(`${url}?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) return point;

      const data = await res.json();
      if (data?.code !== "Ok") return point;

      const nearest = data?.waypoints?.[0];
      const snappedLng = Number(nearest?.location?.[0]);
      const snappedLat = Number(nearest?.location?.[1]);

      if (!Number.isFinite(snappedLat) || !Number.isFinite(snappedLng)) {
        return point;
      }

      return {
        ...point,
        lat: snappedLat,
        lng: snappedLng,
      };
    } catch {
      return point;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  _normalizeRouteResponse(raw, source = "osrm") {
    const routes = Array.isArray(raw?.routes)
      ? raw.routes
          .map((route, index) => {
            const stepCount = (route.legs || []).reduce(
              (sum, leg) => sum + Number(leg?.steps?.length || 0),
              0,
            );
            const turnCount = this._countRouteTurns(route);

            return {
              id: `route_${index + 1}`,
              distance: Number(route.distance || 0),
              duration: Number(route.duration || 0),
              durationInTraffic: Number(route.duration || 0),
              geometry: route.geometry,
              provider: source,
              turnCount,
              stepCount,
              summary:
                route.summary ||
                route.legs
                  ?.map((leg) => leg.summary)
                  .filter(Boolean)
                  .join(" | ") ||
                "Đường nhanh nhất",
              score: this._calculateGoogleLikeScore({
                duration: route.duration,
                turnCount,
                stepCount,
              }),
              legs: (route.legs || []).map((leg) => ({
                distance: Number(leg.distance || 0),
                duration: Number(leg.duration || 0),
                summary: leg.summary || "",
                steps: (leg.steps || []).map((step) => ({
                  instruction: this._buildStepInstruction(step),
                  distance: Number(step.distance || 0),
                  duration: Number(step.duration || 0),
                  name: step.name || "",
                  maneuver: step.maneuver || {},
                })),
              })),
            };
          })
          .sort((a, b) => {
            const scoreDiff = Number(a.score || 0) - Number(b.score || 0);
            if (scoreDiff !== 0) return scoreDiff;

            const durationDiff =
              Number(a.duration || 0) - Number(b.duration || 0);
            if (durationDiff !== 0) return durationDiff;

            return Number(a.distance || 0) - Number(b.distance || 0);
          })
      : [];

    return {
      code: routes.length > 0 ? "Ok" : "NoRoute",
      source,
      routes,
      selectedRouteId: routes[0]?.id || null,
      timestamp: new Date().toISOString(),
      waypoints: (raw?.waypoints || []).map((wp, index) => ({
        index,
        name: wp?.name || null,
        distance: Number(wp?.distance || 0),
        lat: Number(wp?.location?.[1]),
        lng: Number(wp?.location?.[0]),
      })),
    };
  }

  _calculateGoogleLikeScore(route = {}) {
    const baseTimeMinutes = Number(route.duration || 0) / 60;
    const turnCount = Number(route.turnCount || 0);
    const stepCount = Number(route.stepCount || 0);

    const turnPenalty = turnCount * 0.85;
    const complexityPenalty = stepCount > 12 ? (stepCount - 12) * 1.2 : 0;

    return Number(
      (baseTimeMinutes + turnPenalty + complexityPenalty).toFixed(3),
    );
  }

  _countRouteTurns(route = {}) {
    const turnTypes = new Set([
      "turn",
      "fork",
      "roundabout",
      "rotary",
      "roundabout turn",
      "on ramp",
      "off ramp",
    ]);

    let turnCount = 0;

    for (const leg of route.legs || []) {
      for (const step of leg.steps || []) {
        if (turnTypes.has(step?.maneuver?.type)) {
          turnCount += 1;
        }
      }
    }

    return turnCount;
  }

  _buildStepInstruction(step = {}) {
    const maneuver = step.maneuver || {};
    const type = maneuver.type || "continue";
    const modifier = maneuver.modifier ? ` (${maneuver.modifier})` : "";
    const roadName = step.name ? ` vào ${step.name}` : "";
    return `${type}${modifier}${roadName}`.trim();
  }

  _buildFallbackResponse(points, mode) {
    const segments = [];
    let totalDistance = 0;

    for (let i = 0; i < points.length - 1; i += 1) {
      const from = points[i];
      const to = points[i + 1];
      const distance = this._haversineMeters(
        from.lat,
        from.lng,
        to.lat,
        to.lng,
      );
      totalDistance += distance;
      segments.push({
        distance,
        duration: this._estimateDurationSeconds(distance, mode),
        summary: "Fallback đường thẳng",
        steps: [
          {
            instruction: "Di chuyển theo hướng điểm đến (fallback)",
            distance,
            duration: this._estimateDurationSeconds(distance, mode),
            name: "",
            maneuver: {
              type: "depart",
              location: [from.lng, from.lat],
            },
          },
        ],
      });
    }

    const totalDuration = segments.reduce(
      (sum, seg) => sum + Number(seg.duration || 0),
      0,
    );

    return {
      code: "Ok",
      source: "fallback",
      routes: [
        {
          id: "route_1",
          distance: totalDistance,
          duration: totalDuration,
          durationInTraffic: totalDuration,
          geometry: points.map((p) => [p.lng, p.lat]),
          summary: "Fallback estimate",
          provider: "fallback",
          score: this._calculateGoogleLikeScore({
            duration: totalDuration,
            turnCount: 0,
            stepCount: segments.length,
          }),
          legs: segments,
        },
      ],
      selectedRouteId: "route_1",
      timestamp: new Date().toISOString(),
      waypoints: points,
    };
  }

  _mapModeToOsrm(mode) {
    const map = {
      driving: "driving",
      motorcycle: "driving",
      walking: "foot",
      cycling: "bike",
    };
    return map[mode] || "driving";
  }

  _buildOsrmRouteUrl(profile, coords) {
    const base = String(OSRM_URL).replace(/\/+$/, "");
    if (base.endsWith("/route/v1")) {
      return `${base}/${profile}/${coords}`;
    }
    return `${base}/route/v1/${profile}/${coords}`;
  }

  _buildOsrmNearestUrl(profile, point) {
    const base = String(OSRM_URL).replace(/\/+$/, "");
    const coord = `${point.lng},${point.lat}`;
    if (base.endsWith("/nearest/v1")) {
      return `${base}/${profile}/${coord}`;
    }
    return `${base}/nearest/v1/${profile}/${coord}`;
  }

  _buildCacheKey(points, mode, options) {
    const rounded = points
      .map((p) => `${Number(p.lat).toFixed(4)},${Number(p.lng).toFixed(4)}`)
      .join(";");
    return `route:${mode}:${rounded}:${JSON.stringify(options || {})}`;
  }

  _haversineMeters(lat1, lon1, lat2, lon2) {
    const toRadians = (value) => (value * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  _estimateDurationSeconds(distanceMeters, mode) {
    const speedKmh = SPEED_KMH_BY_MODE[mode] || SPEED_KMH_BY_MODE.driving;
    const metersPerSecond = (speedKmh * 1000) / 3600;
    return Math.round(distanceMeters / metersPerSecond);
  }
}

export default new RoutingService();
