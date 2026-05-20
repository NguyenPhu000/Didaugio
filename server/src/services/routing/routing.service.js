import fetch from "node-fetch";
import NodeCache from "node-cache";
import logger from "../../config/logger.js";
import CircuitBreaker from "../../utils/circuitBreaker.js";
import ServiceError from "../../utils/serviceError.js";
import {
  encodePolyline6,
  simplifyGeoJsonLineString,
  simplifyPolyline6,
} from "./polylineSimplifier.js";
import { applyTrafficToResponse } from "./pseudoTraffic.js";
import { calculateTable, calculateSequentialLegs } from "./tableApi.js";

const DEFAULT_TIMEOUT_MS = Number(process.env.ROUTING_TIMEOUT_MS || 4500);
const DEFAULT_TTL_SEC = Number(process.env.ROUTE_CACHE_TTL_SEC || 300);
const FALLBACK_TTL_SEC = Number(process.env.ROUTE_FALLBACK_CACHE_TTL_SEC || 45);
const OSRM_URL = process.env.OSRM_URL || "http://localhost:5000";
const CIRCUIT_FAILURE_THRESHOLD = Number(
  process.env.OSRM_CIRCUIT_FAILURE_THRESHOLD || 5,
);
const CIRCUIT_COOLDOWN_MS = Number(
  process.env.OSRM_CIRCUIT_COOLDOWN_MS || 30000,
);
const POLYLINE_SIMPLIFICATION_TOLERANCE_M = Number(
  process.env.ROUTE_POLYLINE_SIMPLIFICATION_TOLERANCE_M || 8,
);
const CIRCUIT_BREAKER_ENABLED =
  String(process.env.OSRM_CIRCUIT_BREAKER_ENABLED ?? "true") !== "false";
const POLYLINE_SIMPLIFICATION_ENABLED =
  String(process.env.ROUTE_POLYLINE_SIMPLIFICATION_ENABLED ?? "true") !==
  "false";
const MAX_LATENCY_SAMPLES = 500;

const SPEED_KMH_BY_MODE = {
  driving: 30,
  motorcycle: 32,
  walking: 4.8,
  cycling: 14,
};

const percentile = (sortedSamples, fraction) => {
  const index = Math.min(
    sortedSamples.length - 1,
    Math.max(0, Math.ceil(sortedSamples.length * fraction) - 1),
  );
  return Number(sortedSamples[index].toFixed(2));
};

class RoutingService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: DEFAULT_TTL_SEC, useClones: false });
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: CIRCUIT_FAILURE_THRESHOLD,
      cooldownMs: CIRCUIT_COOLDOWN_MS,
    });
    this.metrics = {
      totalRequests: 0,
      fallbackRequests: 0,
      circuitOpenRejects: 0,
      osrmRouteCalls: 0,
      osrmNearestCalls: 0,
      osrmFailures: 0,
      routeCacheHits: 0,
      fallbackCacheHits: 0,
      geometrySimplifiedRoutes: 0,
      geometryOriginalPoints: 0,
      geometrySimplifiedPoints: 0,
      consecutiveFailures: 0,
      lastSuccessAt: null,
      lastFailureAt: null,
      lastFailureMessage: null,
      totalLatencyMs: [],
      osrmRouteLatencyMs: [],
      osrmNearestLatencyMs: [],
    };
  }

  async calculate(payload = {}) {
    const requestStart = Date.now();
    const {
      origin,
      destination,
      waypoints = [],
      mode = "driving",
      options = {},
    } = payload;

    const snapToRoad = options?.snapToRoad !== false;

    const points = [origin, ...waypoints, destination];
    const cacheKey = this._buildCacheKey("route", points, mode, options);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.metrics.routeCacheHits += 1;
      return cached;
    }

    this.metrics.totalRequests += 1;

    if (CIRCUIT_BREAKER_ENABLED && !this.circuitBreaker.beforeRequest()) {
      this.metrics.circuitOpenRejects += 1;
      this._recordLatency("totalLatencyMs", Date.now() - requestStart);
      throw new ServiceError(
        "Hệ thống định tuyến đang bận, vui lòng thử lại sau ít giây",
        503,
        "ROUTING_CIRCUIT_OPEN",
      );
    }

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

      const normalized = this._normalizeRouteResponse(
        osrmResponse,
        "osrm",
        options,
      );
      const withTraffic = applyTrafficToResponse(normalized, new Date(), options?.weather);

      this.cache.set(cacheKey, withTraffic);
      if (CIRCUIT_BREAKER_ENABLED) {
        this.circuitBreaker.recordSuccess();
      }
      this.metrics.consecutiveFailures = 0;
      this.metrics.lastSuccessAt = new Date().toISOString();
      return withTraffic;
    } catch (error) {
      if (CIRCUIT_BREAKER_ENABLED) {
        this.circuitBreaker.recordFailure();
      }
      this.metrics.consecutiveFailures += 1;
      this.metrics.fallbackRequests += 1;
      this.metrics.lastFailureAt = new Date().toISOString();
      this.metrics.lastFailureMessage = error?.message || "OSRM failed";

      logger.warn("[routing] OSRM failed, using fallback route", {
        error: this.metrics.lastFailureMessage,
        mode,
        circuit: this.circuitBreaker.snapshot(),
      });

      const fallbackKey = this._buildCacheKey("fallback", points, mode, options);
      const cachedFallback = this.cache.get(fallbackKey);
      if (cachedFallback) {
        this.metrics.fallbackCacheHits += 1;
        return cachedFallback;
      }

      const fallback = this._buildFallbackResponse(points, mode);
      this.cache.set(fallbackKey, fallback, FALLBACK_TTL_SEC);
      return fallback;
    } finally {
      this._recordLatency("totalLatencyMs", Date.now() - requestStart);
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

    const legResults = await Promise.all(
      waypoints.slice(0, -1).map((from, index) => {
        const to = waypoints[index + 1];
        return this.calculate({
          origin: from,
          destination: to,
          mode,
          options: { ...options, alternatives: 0 },
        }).then((result) => ({
          index,
          from,
          to,
          result,
        }));
      }),
    );

    const legs = [];
    let totalDistance = 0;
    let totalDuration = 0;

    for (const legResult of legResults) {
      const { index, from, to, result } = legResult;
      const firstRoute = result.routes?.[0] || null;
      if (!firstRoute) continue;

      totalDistance += Number(firstRoute.distance || 0);
      totalDuration += Number(firstRoute.duration || 0);

      legs.push({
        index: index + 1,
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

  async calculateTable(payload = {}) {
    const { waypoints = [], mode = "driving" } = payload;
    if (!Array.isArray(waypoints) || waypoints.length < 2) {
      throw new ServiceError(
        "Cần tối thiểu 2 waypoint cho table calculation",
        400,
        "VALIDATION_ERROR",
      );
    }
    this.metrics.totalRequests += 1;
    try {
      const result = await calculateTable(waypoints, mode);
      if (CIRCUIT_BREAKER_ENABLED) this.circuitBreaker.recordSuccess();
      return { code: "Ok", source: "osrm", ...result };
    } catch (error) {
      if (CIRCUIT_BREAKER_ENABLED) this.circuitBreaker.recordFailure();
      this.metrics.osrmFailures += 1;
      throw error;
    }
  }

  async calculateLegsOptimized(payload = {}) {
    const { waypoints = [], mode = "driving", options = {} } = payload;
    if (!Array.isArray(waypoints) || waypoints.length < 2) {
      throw new ServiceError(
        "Cần tối thiểu 2 waypoint để tính legs",
        400,
        "VALIDATION_ERROR",
      );
    }
    try {
      const tableResult = await calculateSequentialLegs(waypoints, mode);
      if (tableResult) {
        return {
          code: "Ok",
          source: tableResult.source,
          totalDistance: tableResult.totalDistance,
          totalDuration: tableResult.totalDuration,
          legs: tableResult.legs.map((leg) => ({
            index: leg.index,
            from: leg.from,
            to: leg.to,
            source: leg.source,
            route: { distance: leg.distance, duration: leg.duration },
          })),
        };
      }
    } catch (error) {
      logger.warn("[routing] Table API optimization failed", { error: error.message });
    }
    return this.calculateLegs(payload);
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
      featureFlags: {
        circuitBreaker: CIRCUIT_BREAKER_ENABLED,
        polylineSimplification: POLYLINE_SIMPLIFICATION_ENABLED,
      },
      fallbackRate,
      circuitBreaker: this.circuitBreaker.snapshot(),
      metrics: this._buildMetricsSnapshot(),
      consecutiveFailures: this.metrics.consecutiveFailures,
      lastSuccessAt: this.metrics.lastSuccessAt,
      lastFailureAt: this.metrics.lastFailureAt,
      lastFailureMessage: this.metrics.lastFailureMessage,
      cache: {
        ttlSec: DEFAULT_TTL_SEC,
        fallbackTtlSec: FALLBACK_TTL_SEC,
        keys: this.cache.keys().length,
      },
    };
  }

  async _callOsrm(points, mode, options = {}) {
    const start = Date.now();
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
      this.metrics.osrmRouteCalls += 1;
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
    } catch (error) {
      this.metrics.osrmFailures += 1;
      throw error;
    } finally {
      clearTimeout(timeoutId);
      this._recordLatency("osrmRouteLatencyMs", Date.now() - start);
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
    const start = Date.now();
    const lat = Number(point?.lat);
    const lng = Number(point?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      logger.warn("[snap-to-road] non-finite coordinates", { point });
      return point;
    }

    const url = this._buildOsrmNearestUrl(profile, { lat, lng });
    const params = new URLSearchParams({ number: "1" });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      this.metrics.osrmNearestCalls += 1;
      const res = await fetch(`${url}?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        logger.warn("[snap-to-road] HTTP error", {
          status: res.status,
          lat,
          lng,
          url: `${url}?${params.toString()}`,
        });
        return point;
      }

      const data = await res.json();
      if (data?.code !== "Ok") {
        logger.warn("[snap-to-road] OSRM returned non-Ok code", {
          code: data?.code,
          message: data?.message,
          lat,
          lng,
        });
        return point;
      }

      const nearest = data?.waypoints?.[0];
      const snappedLng = Number(nearest?.location?.[0]);
      const snappedLat = Number(nearest?.location?.[1]);

      if (!Number.isFinite(snappedLat) || !Number.isFinite(snappedLng)) {
        logger.warn("[snap-to-road] invalid snapped coordinates", {
          nearest,
          lat,
          lng,
        });
        return point;
      }

      const distance = this._haversineMeters(lat, lng, snappedLat, snappedLng);
      if (distance > 100) {
        logger.info("[snap-to-road] large snap distance", {
          originalLat: lat,
          originalLng: lng,
          snappedLat,
          snappedLng,
          distance: Math.round(distance),
        });
      }

      return {
        ...point,
        lat: snappedLat,
        lng: snappedLng,
      };
    } catch (err) {
      logger.warn("[snap-to-road] request failed", {
        error: err?.message,
        lat,
        lng,
      });
      this.metrics.osrmFailures += 1;
      return point;
    } finally {
      clearTimeout(timeoutId);
      this._recordLatency("osrmNearestLatencyMs", Date.now() - start);
    }
  }

  _normalizeRouteResponse(raw, source = "osrm", options = {}) {
    const routes = Array.isArray(raw?.routes)
      ? raw.routes
          .map((route, index) => {
            const stepCount = (route.legs || []).reduce(
              (sum, leg) => sum + Number(leg?.steps?.length || 0),
              0,
            );
            const turnCount = this._countRouteTurns(route);
            const geometryResult = this._simplifyRouteGeometry(
              route.geometry,
              options,
            );

            return {
              id: `route_${index + 1}`,
              distance: Number(route.distance || 0),
              duration: Number(route.duration || 0),
              durationInTraffic: Number(route.duration || 0),
              geometry: geometryResult.geometry,
              geometrySimplification: geometryResult.meta,
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

  _simplifyRouteGeometry(geometry, options = {}) {
    if (!POLYLINE_SIMPLIFICATION_ENABLED || options?.simplifyGeometry === false) {
      return { geometry, meta: null };
    }

    const toleranceMeters = Number(
      options?.simplificationToleranceMeters ||
        POLYLINE_SIMPLIFICATION_TOLERANCE_M,
    );

    if (!Number.isFinite(toleranceMeters) || toleranceMeters <= 0) {
      return { geometry, meta: null };
    }

    let result = null;
    if (typeof geometry === "string") {
      result = simplifyPolyline6(geometry, toleranceMeters);
    } else if (geometry?.type === "LineString") {
      result = simplifyGeoJsonLineString(geometry, toleranceMeters);
    }

    if (!result || result.before <= result.after) {
      return { geometry, meta: null };
    }

    this.metrics.geometrySimplifiedRoutes += 1;
    this.metrics.geometryOriginalPoints += result.before;
    this.metrics.geometrySimplifiedPoints += result.after;

    return {
      geometry: result.geometry,
      meta: {
        algorithm: "douglas-peucker",
        toleranceMeters: result.toleranceMeters,
        before: result.before,
        after: result.after,
        reductionRate: Number(
          ((result.before - result.after) / result.before).toFixed(4),
        ),
      },
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
          geometry: encodePolyline6(points),
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

  _recordLatency(metricKey, value) {
    if (!Number.isFinite(value) || value < 0) return;
    const samples = this.metrics[metricKey];
    if (!Array.isArray(samples)) return;
    samples.push(value);
    if (samples.length > MAX_LATENCY_SAMPLES) {
      samples.splice(0, samples.length - MAX_LATENCY_SAMPLES);
    }
  }

  _buildMetricsSnapshot() {
    const geometryReductionRate =
      this.metrics.geometryOriginalPoints > 0
        ? Number(
            (
              (this.metrics.geometryOriginalPoints -
                this.metrics.geometrySimplifiedPoints) /
              this.metrics.geometryOriginalPoints
            ).toFixed(4),
          )
        : 0;

    return {
      totalRequests: this.metrics.totalRequests,
      fallbackRequests: this.metrics.fallbackRequests,
      circuitOpenRejects: this.metrics.circuitOpenRejects,
      osrmRouteCalls: this.metrics.osrmRouteCalls,
      osrmNearestCalls: this.metrics.osrmNearestCalls,
      osrmFailures: this.metrics.osrmFailures,
      routeCacheHits: this.metrics.routeCacheHits,
      fallbackCacheHits: this.metrics.fallbackCacheHits,
      geometry: {
        simplifiedRoutes: this.metrics.geometrySimplifiedRoutes,
        originalPoints: this.metrics.geometryOriginalPoints,
        simplifiedPoints: this.metrics.geometrySimplifiedPoints,
        reductionRate: geometryReductionRate,
      },
      latencyMs: {
        total: this._buildPercentiles(this.metrics.totalLatencyMs),
        osrmRoute: this._buildPercentiles(this.metrics.osrmRouteLatencyMs),
        osrmNearest: this._buildPercentiles(this.metrics.osrmNearestLatencyMs),
      },
    };
  }

  _buildPercentiles(samples = []) {
    if (!Array.isArray(samples) || samples.length === 0) {
      return { count: 0, p50: null, p95: null, p99: null };
    }

    const sorted = [...samples].sort((a, b) => a - b);
    return {
      count: sorted.length,
      p50: percentile(sorted, 0.5),
      p95: percentile(sorted, 0.95),
      p99: percentile(sorted, 0.99),
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

  _buildCacheKey(prefix, points, mode, options) {
    const rounded = points
      .map((p) => `${Number(p.lat).toFixed(6)},${Number(p.lng).toFixed(6)}`)
      .join(";");
    return `${prefix}:${mode}:${rounded}:${JSON.stringify(options || {})}`;
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
