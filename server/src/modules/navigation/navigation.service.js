import { randomUUID } from "node:crypto";
import NodeCache from "node-cache";
import logger from "../../config/logger.js";
import aiNavigationService from "../../services/ai/aiNavigation.service.js";
import routingService from "../../services/routing/routing.service.js";
import ServiceError from "../../utils/serviceError.js";
import {
  NAVIGATION_DOMAIN_NAME,
  NAVIGATION_EVENT_TYPES,
  NAVIGATION_MAX_EVENTS_PER_SESSION,
  NAVIGATION_TELEMETRY_RETENTION_SEC,
  NAVIGATION_TELEMETRY_SUMMARY_DEFAULT_WINDOW_MINUTES,
  NAVIGATION_UNKNOWN_EVENT_TYPE,
} from "./navigation.constants.js";

const isObject = (value) =>
  value != null && typeof value === "object" && !Array.isArray(value);
const ORCHESTRATOR_AI_ORDERING_ENABLED =
  String(process.env.NAVIGATION_ORCHESTRATOR_AI_ORDERING_ENABLED ?? "true") !==
  "false";

const sanitizePayload = (value) => {
  if (!isObject(value)) return {};
  return value;
};

const normalizeTimestamp = (value) => {
  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
};

const normalizeLocation = (value) => {
  const lat = Number(value?.lat);
  const lng = Number(value?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
  };
};

class NavigationDomainService {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: NAVIGATION_TELEMETRY_RETENTION_SEC,
      useClones: false,
      checkperiod: Math.max(
        60,
        Math.floor(NAVIGATION_TELEMETRY_RETENTION_SEC / 4),
      ),
    });

    this.metrics = {
      totalBatches: 0,
      totalAcceptedEvents: 0,
      lastBatchAt: null,
      lastBatchSessionId: null,
    };
  }

  async recommendRoute(payload = {}) {
    if (Array.isArray(payload?.waypoints) && payload.waypoints.length > 0) {
      return this.orchestrateRoute(payload);
    }

    const result = await aiNavigationService.getNavigationAdvice(payload);

    logger.info(
      `[${NAVIGATION_DOMAIN_NAME}] recommendation source=${result?.source || "unknown"} routeId=${result?.recommendation?.routeId || "n/a"}`,
    );

    return result;
  }

  async orchestrateRoute(payload = {}) {
    const {
      origin,
      destination,
      waypoints = [],
      mode = "motorcycle",
      options = {},
      context = {},
    } = payload;

    const orderAdvice = ORCHESTRATOR_AI_ORDERING_ENABLED
      ? await aiNavigationService.getWaypointOrderAdvice({
          origin,
          destination,
          waypoints,
          context,
        })
      : {
          source: "flag_disabled",
          orderedWaypointIndexes: waypoints.map((_, index) => index),
          reason:
            "AI waypoint ordering đang tắt bằng feature flag, hệ thống giữ nguyên thứ tự điểm đến.",
          warnings: [],
          confidence: 0.5,
        };

    const orderedWaypoints = orderAdvice.orderedWaypointIndexes
      .map((index) => waypoints[index])
      .filter(Boolean);

    const route = await routingService.calculate({
      origin,
      destination,
      waypoints: orderedWaypoints,
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
    });

    const firstRoute = route.routes?.[0] || null;
    const result = {
      source: "orchestrator",
      strategy: {
        waypointOrdering: orderAdvice.source,
        geometryProvider: route.source,
      },
      featureFlags: {
        aiWaypointOrdering: ORCHESTRATOR_AI_ORDERING_ENABLED,
      },
      recommendation: {
        routeId: firstRoute?.id || route.selectedRouteId || null,
        reason: orderAdvice.reason,
        tips: [
          "AI chỉ sắp xếp thứ tự điểm đến; tuyến đường thực tế được OSRM dựng từ dữ liệu đường.",
        ],
        warnings: orderAdvice.warnings || [],
        confidence: orderAdvice.confidence,
      },
      orderedWaypointIndexes: orderAdvice.orderedWaypointIndexes,
      orderedWaypoints,
      route,
    };

    logger.info(
      `[${NAVIGATION_DOMAIN_NAME}.orchestrator] order=${orderAdvice.source} geometry=${route.source} waypoints=${orderedWaypoints.length}`,
    );

    return result;
  }

  ingestTelemetryBatch({ sessionId, meta = {}, events = [], actor = {} } = {}) {
    if (!Array.isArray(events) || events.length === 0) {
      throw new ServiceError("Payload telemetry rỗng", 400, "VALIDATION_ERROR");
    }

    const resolvedSessionId = String(sessionId || randomUUID());
    const existingSession =
      this.cache.get(resolvedSessionId) ||
      this._createSessionBucket(resolvedSessionId, meta, actor);

    const normalizedEvents = events.map((event) =>
      this._normalizeTelemetryEvent(event),
    );

    const nextEvents = [...existingSession.events, ...normalizedEvents].slice(
      -NAVIGATION_MAX_EVENTS_PER_SESSION,
    );

    const nextCounters = { ...existingSession.counters };
    normalizedEvents.forEach((event) => {
      nextCounters[event.eventType] = (nextCounters[event.eventType] || 0) + 1;
    });

    const updatedSession = {
      ...existingSession,
      actor: {
        ...existingSession.actor,
        ...sanitizePayload(actor),
      },
      meta: {
        ...existingSession.meta,
        ...sanitizePayload(meta),
      },
      events: nextEvents,
      counters: nextCounters,
      updatedAt: new Date().toISOString(),
      firstEventAt: nextEvents[0]?.eventAt || existingSession.firstEventAt,
      lastEventAt:
        nextEvents[nextEvents.length - 1]?.eventAt ||
        existingSession.lastEventAt,
    };

    this.cache.set(resolvedSessionId, updatedSession);

    this.metrics.totalBatches += 1;
    this.metrics.totalAcceptedEvents += normalizedEvents.length;
    this.metrics.lastBatchAt = new Date().toISOString();
    this.metrics.lastBatchSessionId = resolvedSessionId;

    logger.info(
      `[${NAVIGATION_DOMAIN_NAME}.telemetry] session=${resolvedSessionId} accepted=${normalizedEvents.length} stored=${updatedSession.events.length}`,
    );

    return {
      sessionId: resolvedSessionId,
      accepted: normalizedEvents.length,
      stored: updatedSession.events.length,
      retentionSec: NAVIGATION_TELEMETRY_RETENTION_SEC,
      firstEventAt: updatedSession.firstEventAt,
      lastEventAt: updatedSession.lastEventAt,
      counters: updatedSession.counters,
    };
  }

  getTelemetryHealth() {
    return {
      status: "ok",
      domain: NAVIGATION_DOMAIN_NAME,
      metrics: {
        ...this.metrics,
      },
      cache: {
        sessionCount: this.cache.keys().length,
        retentionSec: NAVIGATION_TELEMETRY_RETENTION_SEC,
        maxEventsPerSession: NAVIGATION_MAX_EVENTS_PER_SESSION,
      },
    };
  }

  getSessionTelemetry(sessionId, { limit = 120 } = {}) {
    const key = String(sessionId || "").trim();
    if (!key) {
      throw new ServiceError("Thiếu sessionId", 400, "VALIDATION_ERROR");
    }

    const session = this.cache.get(key);
    if (!session) {
      throw new ServiceError(
        "Không tìm thấy phiên telemetry",
        404,
        "NOT_FOUND",
      );
    }

    const safeLimit = Math.max(
      1,
      Math.min(Number(limit) || 120, NAVIGATION_MAX_EVENTS_PER_SESSION),
    );

    return {
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      firstEventAt: session.firstEventAt,
      lastEventAt: session.lastEventAt,
      actor: session.actor,
      meta: session.meta,
      counters: session.counters,
      totalEvents: session.events.length,
      events: session.events.slice(-safeLimit),
    };
  }

  getTelemetrySummary({
    sinceMinutes = NAVIGATION_TELEMETRY_SUMMARY_DEFAULT_WINDOW_MINUTES,
    topSessions = 10,
  } = {}) {
    const safeSinceMinutes = Math.max(1, Number(sinceMinutes) || 1);
    const safeTopSessions = Math.max(1, Number(topSessions) || 1);
    const windowStartMs = Date.now() - safeSinceMinutes * 60 * 1000;

    const totalCounters = {};
    const perSession = [];
    let totalEvents = 0;

    this.cache.keys().forEach((sessionId) => {
      const session = this.cache.get(sessionId);
      if (!session) return;

      const filteredEvents = (session.events || []).filter((event) => {
        const time = new Date(event?.eventAt || 0).getTime();
        return Number.isFinite(time) && time >= windowStartMs;
      });

      if (filteredEvents.length === 0) return;

      totalEvents += filteredEvents.length;
      const sessionCounters = {};
      filteredEvents.forEach((event) => {
        const type = event?.eventType || NAVIGATION_UNKNOWN_EVENT_TYPE;
        totalCounters[type] = (totalCounters[type] || 0) + 1;
        sessionCounters[type] = (sessionCounters[type] || 0) + 1;
      });
      const startedCount = sessionCounters.navigation_started || 0;
      const deviationCount = sessionCounters.route_deviation || 0;
      const rerouteCount = sessionCounters.reroute_requested || 0;

      perSession.push({
        sessionId,
        userId: session.actor?.userId || null,
        eventCount: filteredEvents.length,
        firstEventAt: filteredEvents[0]?.eventAt || null,
        lastEventAt: filteredEvents[filteredEvents.length - 1]?.eventAt || null,
        counters: sessionCounters,
        quality: {
          routeDeviationRate:
            startedCount > 0
              ? Number((deviationCount / startedCount).toFixed(4))
              : 0,
          rerouteFrequency: rerouteCount,
        },
      });
    });

    const topActiveSessions = perSession
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, safeTopSessions);

    const knownTypes = NAVIGATION_EVENT_TYPES.reduce((acc, type) => {
      acc[type] = totalCounters[type] || 0;
      return acc;
    }, {});

    if (totalCounters[NAVIGATION_UNKNOWN_EVENT_TYPE]) {
      knownTypes[NAVIGATION_UNKNOWN_EVENT_TYPE] =
        totalCounters[NAVIGATION_UNKNOWN_EVENT_TYPE];
    }

    const navigationStarted = totalCounters.navigation_started || 0;
    const routeDeviationEvents = totalCounters.route_deviation || 0;
    const rerouteEvents = totalCounters.reroute_requested || 0;

    return {
      window: {
        sinceMinutes: safeSinceMinutes,
        startedAt: new Date(windowStartMs).toISOString(),
        endedAt: new Date().toISOString(),
      },
      totals: {
        sessions: perSession.length,
        events: totalEvents,
        byEventType: knownTypes,
        quality: {
          routeDeviationEvents,
          rerouteEvents,
          routeDeviationRate:
            navigationStarted > 0
              ? Number((routeDeviationEvents / navigationStarted).toFixed(4))
              : 0,
          rerouteFrequencyPerSession:
            perSession.length > 0
              ? Number((rerouteEvents / perSession.length).toFixed(4))
              : 0,
        },
      },
      topActiveSessions,
    };
  }

  _createSessionBucket(sessionId, meta = {}, actor = {}) {
    const now = new Date().toISOString();
    return {
      sessionId,
      createdAt: now,
      updatedAt: now,
      firstEventAt: null,
      lastEventAt: null,
      actor: sanitizePayload(actor),
      meta: sanitizePayload(meta),
      counters: {},
      events: [],
    };
  }

  _normalizeTelemetryEvent(event) {
    const rawType = String(event?.eventType || "").trim();
    const eventType = NAVIGATION_EVENT_TYPES.includes(rawType)
      ? rawType
      : NAVIGATION_UNKNOWN_EVENT_TYPE;

    const legIndex = Number(event?.legIndex);

    return {
      eventId: randomUUID(),
      eventType,
      eventAt: normalizeTimestamp(event?.eventAt),
      routeId: event?.routeId ? String(event.routeId) : null,
      legIndex: Number.isFinite(legIndex) ? legIndex : null,
      location: normalizeLocation(event?.location),
      payload: sanitizePayload(event?.payload),
    };
  }
}

export default new NavigationDomainService();
