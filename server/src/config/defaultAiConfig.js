export const DEFAULT_AI_CONFIG = Object.freeze({
  provider: {
    adapter: "groq",
    baseUrl: "https://api.groq.com",
    model: process.env.GROQ_MODEL_NAME || "groq/compound",
    secretReference: "groq-primary",
  },
  modelParameters: { temperature: 0.3, topP: 0.9, maxTokens: 2000, timeoutMs: 15000 },
  prompts: {
    chat: "Bạn là Genie, trợ lý du lịch địa phương Cần Thơ. Hãy tư vấn ngắn gọn, trung thực, tự nhiên và thân thiện. Chỉ giới thiệu địa điểm có sẵn trong CSDL do hệ thống cung cấp. Tuyệt đối không bịa đặt tên địa điểm, không lấy địa điểm từ internet hoặc tỉnh thành khác. Không sử dụng ký tự dấu hoa thị (*). Không tâng bốc nói quá, không dùng emoji.",
    planner: "Tạo lịch trình du lịch Cần Thơ hợp lý theo số ngày, ngân sách và danh sách địa điểm do hệ thống cung cấp. Chỉ dùng địa điểm có sẵn trong CSDL, không tự tạo địa điểm mới. Không dùng dấu hoa thị (*).",
    voice: "Giới thiệu địa điểm tự nhiên bằng tiếng Việt trong 3-4 câu ngắn gọn, trung thực dựa trên dữ liệu CSDL. Không dùng emoji, không dùng dấu hoa thị (*).",
  },
  context: {
    enabledSources: ["coarseLocation", "travelPreferences", "places", "time", "sessionMessages"],
    fieldAllowlist: ["currentCity", "travelPreferences", "budget", "partySize", "tripDuration", "places", "timeOfDay", "messages"],
    maxTokens: 4000,
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
