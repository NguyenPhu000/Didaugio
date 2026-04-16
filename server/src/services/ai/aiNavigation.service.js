import { geminiModel } from "../../config/geminiClient.js";

class AINavigationService {
  async getNavigationAdvice(payload = {}) {
    const { origin, destination, routes = [], context = {} } = payload;

    if (!Array.isArray(routes) || routes.length === 0) {
      return this._fallbackRecommendation(routes, context);
    }

    const prompt = this._buildPrompt({ origin, destination, routes, context });

    try {
      const result = await geminiModel.generateContent(prompt);
      const text = result?.response?.text?.() || "";
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

  _tryParseJson(text = "") {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const jsonOnly = trimmed
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/, "")
      .trim();

    try {
      return JSON.parse(jsonOnly);
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

  _countTurns(route) {
    const steps = route?.legs?.flatMap((leg) => leg.steps || []) || [];
    return steps.filter((step) => {
      const type = step?.maneuver?.type || "";
      return type === "turn" || type === "fork" || type === "roundabout";
    }).length;
  }
}

export default new AINavigationService();
