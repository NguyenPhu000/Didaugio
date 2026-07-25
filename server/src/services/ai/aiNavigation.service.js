import {
  createGroqClient,
  resolveGroqProviderOptions,
} from "./groq.service.js";
import { executeAiRequest } from "./runtime/aiRuntimeExecution.js";
import { parseAiJsonObject } from "./aiJsonParser.js";
import {
  logAiProviderEvent,
  normalizeProviderMessages,
  toAiServiceError,
} from "./aiProviderPolicy.js";

const MAX_NAVIGATION_ROUTES = 6;
const MAX_NAVIGATION_WAYPOINTS = 12;
const MAX_LABEL_LENGTH = 160;
const MAX_SUMMARY_LENGTH = 240;

function boundedNavigationText(value, maxLength, fallback) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted]")
    .replace(/(?:\+?\d[\s().-]*){9,}/g, "[redacted]")
    .replace(/-?\d{1,3}\.\d+\s*[,;]\s*-?\d{1,3}\.\d+/g, "[redacted]")
    .trim();
  return (normalized || fallback).slice(0, maxLength);
}

function boundedNavigationNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100_000_000, Math.round(number)));
}

export function sanitizeNavigationProviderPayload(payload = {}, mode = "route") {
  const context = payload.context ?? {};
  const base = {
    originLabel: boundedNavigationText(
      payload.origin?.name,
      MAX_LABEL_LENGTH,
      "current_origin",
    ),
    destinationLabel: boundedNavigationText(
      payload.destination?.name,
      MAX_LABEL_LENGTH,
      "selected_destination",
    ),
    question: boundedNavigationText(
      context.question,
      MAX_SUMMARY_LENGTH,
      mode === "route"
        ? "Recommend a navigation route"
        : "Order navigation waypoints",
    ),
    timeOfDay: boundedNavigationText(
      context.time,
      MAX_LABEL_LENGTH,
      "not_provided",
    ),
    transportPreference: boundedNavigationText(
      context.vehicleType,
      MAX_LABEL_LENGTH,
      "motorcycle",
    ),
  };

  if (mode === "waypoint") {
    return {
      ...base,
      waypoints: (Array.isArray(payload.waypoints) ? payload.waypoints : [])
        .slice(0, MAX_NAVIGATION_WAYPOINTS)
        .map((point, index) => ({
          index,
          label: boundedNavigationText(
            point?.name,
            MAX_LABEL_LENGTH,
            `Waypoint ${index}`,
          ),
        })),
    };
  }

  return {
    ...base,
    routes: (Array.isArray(payload.routes) ? payload.routes : [])
      .slice(0, MAX_NAVIGATION_ROUTES)
      .map((route, index) => ({
        id: boundedNavigationText(
          route?.id,
          MAX_LABEL_LENGTH,
          `route-${index + 1}`,
        ),
        distance: boundedNavigationNumber(route?.distance),
        duration: boundedNavigationNumber(route?.duration),
        summary: boundedNavigationText(
          route?.summary,
          MAX_SUMMARY_LENGTH,
          "n/a",
        ),
      })),
  };
}

function navigationSafetyText(payload) {
  return JSON.stringify(payload);
}

export async function requestNavigationCompletion({
  client,
  prompt,
  feature,
  providerOptions,
}) {
  const startedAt = Date.now();
  try {
    const completion = await client.chat.completions.create({
      model: providerOptions.model,
      messages: normalizeProviderMessages([{ role: "user", content: prompt }]),
      temperature: Math.min(providerOptions.temperature, 0.3),
      top_p: providerOptions.topP,
      max_tokens: providerOptions.maxTokens,
    }, { timeout: providerOptions.timeoutMs });
    logAiProviderEvent({
      feature,
      model: providerOptions.model,
      startedAt,
      completion,
    });
    return completion;
  } catch (error) {
    const aiError = toAiServiceError(error);
    logAiProviderEvent({
      feature,
      model: providerOptions.model,
      startedAt,
      code: aiError.code,
    });
    throw aiError;
  }
}

class AINavigationService {
  constructor({
    executeRequest = executeAiRequest,
    resolveProviderOptions = resolveGroqProviderOptions,
    createClient = createGroqClient,
  } = {}) {
    this.executeRequest = executeRequest;
    this.resolveProviderOptions = resolveProviderOptions;
    this.createClient = createClient;
  }

  async getNavigationAdvice(payload = {}, actor = {}) {
    const { routes = [], context = {} } = payload;

    if (!Array.isArray(routes) || routes.length === 0) {
      return this._fallbackRecommendation(routes, context);
    }

    const providerPayload = sanitizeNavigationProviderPayload(payload, "route");
    try {
      const execution = await this.executeRequest({
        feature: "navigation-route-advice",
        user: actor,
        inputText: navigationSafetyText(providerPayload),
        context: {
          timeOfDay: providerPayload.timeOfDay,
          transportPreference: providerPayload.transportPreference,
        },
        operation: async ({ configData, context: allowedContext }) => {
          const providerOptions = await this.resolveProviderOptions(
            configData,
            "chat",
          );
          const client = this.createClient(providerOptions);
          const prompt = this._buildPrompt({
            ...providerPayload,
            context: allowedContext,
          });
          const completion = await requestNavigationCompletion({
            client,
            prompt,
            feature: "navigation-route-advice",
            providerOptions,
          });
          return {
            outputText:
              completion.choices[0]?.message?.content || "",
            completion,
          };
        },
      });
      const completion = execution.result.completion;
      const text = completion.choices[0]?.message?.content || "";
      const parsed = this._tryParseJson(text);

      if (parsed?.recommendation?.routeId) {
        return {
          source: "ai",
          recommendation: parsed.recommendation,
          fullAnalysis: parsed.fullAnalysis || text,
        };
      }
    } catch {
      // Fall through to deterministic fallback
    }

    return this._fallbackRecommendation(routes, context);
  }

  async getWaypointOrderAdvice(payload = {}, actor = {}) {
    const { waypoints = [] } = payload;
    const normalizedWaypoints = Array.isArray(waypoints) ? waypoints : [];

    if (normalizedWaypoints.length === 0) {
      return this._fallbackWaypointOrder(normalizedWaypoints);
    }

    const providerPayload = sanitizeNavigationProviderPayload(
      payload,
      "waypoint",
    );
    try {
      const execution = await this.executeRequest({
        feature: "navigation-waypoint-order",
        user: actor,
        inputText: navigationSafetyText(providerPayload),
        context: {
          timeOfDay: providerPayload.timeOfDay,
          transportPreference: providerPayload.transportPreference,
        },
        operation: async ({ configData, context: allowedContext }) => {
          const providerOptions = await this.resolveProviderOptions(
            configData,
            "chat",
          );
          const client = this.createClient(providerOptions);
          const prompt = this._buildWaypointOrderPrompt({
            ...providerPayload,
            context: allowedContext,
          });
          const completion = await requestNavigationCompletion({
            client,
            prompt,
            feature: "navigation-waypoint-order",
            providerOptions,
          });
          return {
            outputText:
              completion.choices[0]?.message?.content || "",
            completion,
          };
        },
      });
      const completion = execution.result.completion;
      const text = completion.choices[0]?.message?.content || "";
      const parsed = this._tryParseJson(text);
      const orderedIndexes = this._sanitizeWaypointIndexes(
        parsed?.orderedWaypointIndexes,
        normalizedWaypoints.length,
      );

      if (orderedIndexes.length === normalizedWaypoints.length) {
        return {
          source: "ai",
          orderedWaypointIndexes: orderedIndexes,
          reason:
            parsed?.reason ||
            "AI đã sắp xếp thứ tự điểm đến theo ngữ cảnh người dùng.",
          warnings: Array.isArray(parsed?.warnings) ? parsed.warnings : [],
          confidence: Number(parsed?.confidence || 0.72),
        };
      }
    } catch {
      // Fall through to deterministic ordering.
    }

    return this._fallbackWaypointOrder(normalizedWaypoints);
  }

  _buildPrompt({
    originLabel,
    destinationLabel,
    question,
    routes,
    context,
  }) {
    const summaries = routes
      .map(
        (route) =>
          `- ${route.id}: distance=${Math.round(route.distance)}m, duration=${Math.round(route.duration)}s, summary=${route.summary || "n/a"}`,
      )
      .join("\n");

    return `Ban la tro ly AI navigation cho Viet Nam.
Hay phan tich cac route alternatives va tra ve JSON hop le theo schema sau:
{
  "recommendation": {
    "routeId": "route_1",
    "reason": "...",
    "tips": ["..."],
    "warnings": ["..."],
    "confidence": 0.0
  },
  "fullAnalysis": "..."
}

Input:
- Origin: ${originLabel}
- Destination: ${destinationLabel}
- Time: ${context?.timeOfDay || "not_provided"}
- Vehicle: ${context?.transportPreference || "motorcycle"}
- Preference: ${context?.userPreference || "fastest"}
- Question: ${question}

Routes:
${summaries}

Quy tac:
- Uu tien duration truoc, distance thu hai, do phuc tap re huong thu ba.
- Tra ve JSON thuần, khong markdown.
`;
  }

  _buildWaypointOrderPrompt({
    originLabel,
    destinationLabel,
    waypoints,
    context,
  }) {
    const waypointList = waypoints
      .map((point) => `- ${point.index}: ${point.label}`)
      .join("\n");

    return `Ban la tro ly sap xep lich trinh tham quan tai Viet Nam.
Hay chi sap xep THU TU cac waypoint trung gian, khong tu ve duong, khong tao toa do moi.
Tra ve JSON hop le theo schema:
{
  "orderedWaypointIndexes": [0, 1],
  "reason": "...",
  "warnings": ["..."],
  "confidence": 0.0
}

Input:
- Origin: ${originLabel}
- Destination: ${destinationLabel}
- Time: ${context?.timeOfDay || "not_provided"}
- Intent: ${context?.intent || context?.userPreference || "balanced"}
- Vehicle: ${context?.transportPreference || "motorcycle"}

Waypoints:
${waypointList}

Quy tac bat buoc:
- Chi duoc dung cac index da cho, khong duoc them/xoa/doi toa do.
- Uu tien logic con nguoi theo thoi diem trong ngay, sau do moi den khoang cach gan dung.
- Neu khong chac, giu thu tu ban dau.
- Tra ve JSON thuan, khong markdown.
`;
  }

  _tryParseJson(text = "") {
    try {
      return parseAiJsonObject(text);
    } catch {
      return null;
    }
  }

  _fallbackRecommendation(routes = [], context = {}) {
    const ranked = [...(routes || [])].sort((a, b) => {
      const durationDiff = Number(a.duration || 0) - Number(b.duration || 0);
      if (durationDiff !== 0) return durationDiff;

      const distanceDiff = Number(a.distance || 0) - Number(b.distance || 0);
      if (distanceDiff !== 0) return distanceDiff;

      const turnA = this._countTurns(a);
      const turnB = this._countTurns(b);
      return turnA - turnB;
    });

    const top = ranked[0] || { id: "route_1", duration: 0, distance: 0 };

    return {
      source: "fallback",
      recommendation: {
        routeId: top.id,
        reason:
          "AI tạm thời không khả dụng, hệ thống chọn tuyến tối ưu theo thời gian + khoảng cách.",
        tips: [
          "Xuất phát sớm 10-15 phút để giảm rủi ro kẹt xe.",
          `Ưu tiên tuyến có thời gian ngắn nhất theo chế độ ${context?.vehicleType || "di chuyển hiện tại"}.`,
        ],
        warnings: [
          "Dự báo giao thông realtime có thể thay đổi theo thời điểm.",
        ],
        confidence: 0.62,
      },
      fullAnalysis:
        "Fallback deterministic ranking được áp dụng do AI timeout/quota/unavailable.",
    };
  }

  _fallbackWaypointOrder(waypoints = []) {
    return {
      source: "fallback",
      orderedWaypointIndexes: waypoints.map((_, index) => index),
      reason:
        "AI tạm thời không khả dụng, hệ thống giữ nguyên thứ tự điểm đến đã chọn.",
      warnings: [],
      confidence: 0.58,
    };
  }

  _sanitizeWaypointIndexes(value, waypointCount) {
    if (!Array.isArray(value)) return [];

    const seen = new Set();
    const indexes = [];

    value.forEach((rawIndex) => {
      const index = Number(rawIndex);
      if (!Number.isInteger(index)) return;
      if (index < 0 || index >= waypointCount) return;
      if (seen.has(index)) return;
      seen.add(index);
      indexes.push(index);
    });

    return indexes;
  }

  _countTurns(route) {
    const steps = route?.legs?.flatMap((leg) => leg.steps || []) || [];
    return steps.filter((step) => {
      const type = step?.maneuver?.type || "";
      return type === "turn" || type === "fork" || type === "roundabout";
    }).length;
  }
}

export function createAiNavigationService(dependencies = {}) {
  return new AINavigationService(dependencies);
}

export default createAiNavigationService();
