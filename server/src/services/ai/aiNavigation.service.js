import { createGroqClient, GROQ_MODEL } from "./groq.service.js";
import { parseAiJsonObject } from "./aiJsonParser.js";

class AINavigationService {
  async getNavigationAdvice(payload = {}) {
    const { origin, destination, routes = [], context = {} } = payload;

    if (!Array.isArray(routes) || routes.length === 0) {
      return this._fallbackRecommendation(routes, context);
    }

    const prompt = this._buildPrompt({ origin, destination, routes, context });

    try {
      const client = createGroqClient();
      const completion = await client.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 800,
      });
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

  async getWaypointOrderAdvice(payload = {}) {
    const { origin, destination, waypoints = [], context = {} } = payload;
    const normalizedWaypoints = Array.isArray(waypoints) ? waypoints : [];

    if (normalizedWaypoints.length === 0) {
      return this._fallbackWaypointOrder(normalizedWaypoints);
    }

    const prompt = this._buildWaypointOrderPrompt({
      origin,
      destination,
      waypoints: normalizedWaypoints,
      context,
    });

    try {
      const client = createGroqClient();
      const completion = await client.chat.completions.create({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 800,
      });
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

  _buildPrompt({ origin, destination, routes, context }) {
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
- Origin: ${origin?.name || `${origin?.lat},${origin?.lng}`}
- Destination: ${destination?.name || `${destination?.lat},${destination?.lng}`}
- Time: ${context?.time || "not_provided"}
- Vehicle: ${context?.vehicleType || "motorcycle"}
- Preference: ${context?.userPreference || "fastest"}
- Question: ${context?.question || "Nen di route nao?"}

Routes:
${summaries}

Quy tac:
- Uu tien duration truoc, distance thu hai, do phuc tap re huong thu ba.
- Tra ve JSON thuần, khong markdown.
`;
  }

  _buildWaypointOrderPrompt({ origin, destination, waypoints, context }) {
    const waypointList = waypoints
      .map((point, index) => {
        const label = point?.name || `Waypoint ${index}`;
        return `- ${index}: ${label} (${point?.lat},${point?.lng})`;
      })
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
- Origin: ${origin?.name || `${origin?.lat},${origin?.lng}`}
- Destination: ${destination?.name || `${destination?.lat},${destination?.lng}`}
- Time: ${context?.time || "not_provided"}
- Intent: ${context?.intent || context?.userPreference || "balanced"}
- Vehicle: ${context?.vehicleType || "motorcycle"}

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

export default new AINavigationService();
