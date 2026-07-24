export const DEFAULT_AI_CONFIG = Object.freeze({
  provider: {
    adapter: "groq",
    baseUrl: "https://api.groq.com",
    model: process.env.GROQ_MODEL_NAME || "meta-llama/llama-4-scout-17b-16e-instruct",
    secretReference: "groq-primary",
  },
  modelParameters: { temperature: 0.3, topP: 0.9, maxTokens: 2000, timeoutMs: 15000 },
  prompts: {
    chat: "Bạn là Genie, trợ lý du lịch địa phương. Trả lời ngắn gọn, trung thực và chỉ dùng dữ liệu địa điểm do hệ thống cung cấp.",
    planner: "Tạo lịch trình khả thi theo số ngày, ngân sách và danh sách địa điểm do hệ thống cung cấp. Không tự tạo địa điểm.",
    voice: "Giới thiệu địa điểm tự nhiên bằng tiếng Việt trong 3-4 câu ngắn. Không dùng emoji.",
  },
  context: {
    enabledSources: ["coarseLocation", "travelPreferences", "places", "time"],
    fieldAllowlist: ["currentCity", "travelPreferences", "budget", "partySize", "tripDuration", "places", "timeOfDay"],
    maxTokens: 1800,
    freshnessTtl: 300,
  },
  safety: {
    blockedKeywords: [],
    matchMode: "substring",
    diacriticInsensitive: false,
    safeResponse: "Genie không thể hỗ trợ yêu cầu này.",
  },
  quotas: { freeDailyRequests: 20, premiumDailyRequests: 200 },
  fallback: {
    maintenanceMessage: "Trợ lý AI đang bảo trì, vui lòng thử lại sau.",
    staticPlannerEnabled: true,
  },
});
