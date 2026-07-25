/**
 * groq.service.js — Groq Cloud AI integration.
 * Uses the official Groq SDK.
 */
import Groq from "groq-sdk";
import { resolveProviderSecret } from "../adminAi/aiCredential.service.js";
import { renderConfiguredPrompt } from "../../lib/promptBuilder.js";
import {
  logAiProviderEvent,
  normalizeProviderMessages,
  toAiServiceError,
} from "./aiProviderPolicy.js";

export function createGroqClient({
  apiKey,
  baseUrl = "https://api.groq.com",
} = {}) {
  if (!apiKey) {
    throw Object.assign(new Error("Groq credential is unavailable."), {
      code: "AI_SECRET_UNAVAILABLE",
      errorCode: "AI_SECRET_UNAVAILABLE",
      statusCode: 503,
    });
  }
  return new Groq({ apiKey, baseURL: baseUrl });
}

export async function resolveGroqProviderOptions(configData, feature) {
  const apiKey = await resolveProviderSecret(
    configData.provider.secretReference,
  );
  return {
    apiKey,
    baseUrl: configData.provider.baseUrl,
    model: configData.provider.model,
    temperature: configData.modelParameters.temperature,
    topP: configData.modelParameters.topP,
    maxTokens: configData.modelParameters.maxTokens,
    timeoutMs: configData.modelParameters.timeoutMs,
    configuredPrompt: configData.prompts[feature],
  };
}

/**
 * Format price range to human-readable Vietnamese string.
 * Under 1M: "120k", over 1M: "1.5 triệu"
 * @param {number|null} from
 * @param {number|null} to
 * @returns {string}
 */
function formatPriceRange(from, to) {
  if (!from && !to) return "Chưa cập nhật";
  const fmt = (v) => {
    if (!v || v <= 0) return null;
    if (v >= 1_000_000) {
      const millions = v / 1_000_000;
      return millions % 1 === 0 ? `${millions} triệu` : `${millions.toFixed(1)} triệu`;
    }
    return `${Math.round(v / 1000)}k`;
  };
  const f = fmt(from);
  const t = fmt(to);
  if (f && t) return f === t ? f : `${f} - ${t}`;
  return f || t || "Chưa cập nhật";
}

/**
 * Build system prompt for the travel assistant persona with user context.
 * @param {Object} context
 * @param {string} [context.currentCity]
 * @param {{ latitude: number, longitude: number }} [context.currentCoords]
 * @param {Array} [context.systemPlaces] - RAG places from DB
 * @param {Object} [context.locationContext] - Detailed district and ward
 * @param {Object} [context.travelPreferences] - User travel preferences from DB
 */
function buildGroqSystemPrompt(context = {}, configuredPrompt = "") {
  const parts = [
    renderConfiguredPrompt(configuredPrompt, context),
    `Bạn là "Genie" — trợ lý du lịch ảo của ứng dụng "iPoint Genie", đóng vai một người bạn địa phương Cần Thơ am hiểu, hay đi đây đi đó.`,
    `Nhiệm vụ: tư vấn lịch trình, gợi ý quán ăn, điểm check-in một cách tự nhiên, như đang trò chuyện với bạn bè.`,
    ``,
    `Phong cách trả lời:`,
    `- Trò chuyện tự nhiên, như đang nhắn tin cho bạn, KHÔNG phải robot đọc danh sách`,
    `- Dùng ngôn ngữ miền Nam nhẹ nhàng: "nè", "đó", "ha", "nghen", "ơi" ở cuối câu khi phù hợp`,
    `- Khi gợi ý địa điểm: kể như đang giới thiệu cho bạn, nhấn mạnh điểm đặc biệt nhất trước`,
    `- Mỗi lần gợi ý 2-3 chỗ cụ thể kèm GIÁ THẬT từ dữ liệu, KHÔNG nói chung chung`,
    `- Nếu người dùng hỏi mơ hồ (ví dụ: "đi đâu chơi"), hãy hỏi lại cho rõ: muốn ăn gì, budget bao nhiêu, thích kiểu nào`,
    `- Nhớ ngữ cảnh cuộc trò chuyện trước đó, nếu user từng hỏi thì nhắc lại để tạo liền mạch`,
    `- Nếu người dùng chê "đắt quá" hoặc muốn "rẻ hơn", gợi ý thay thế từ dữ liệu có giá thấp hơn`,
    `- Trả lời ngắn gọn, xuống dòng rõ ràng, mỗi ý cách một dòng trống cho dễ đọc trên điện thoại`,
    ``,
    `Định dạng giá cả (RẤT QUAN TRỌNG):`,
    `- Giá dưới 1 triệu: viết dạng "120k", "50k", "250k"`,
    `- Giá từ 1 triệu trở lên: viết dạng "1.5 triệu", "2 triệu"`,
    `- Khoảng giá: "120k - 250k" hoặc "1.5 - 2 triệu"`,
    `- KHÔNG BAO GIỜ viết dạng "120000đ" hay "1500000đ" — rất khó đọc`,
    ``,
    `Nguyên tắc bắt buộc:`,
    `- Nếu không biết → thành thật nói "Genie chưa có thông tin nè", KHÔNG bịa đặt`,
    `- Trả lời bằng tiếng Việt trừ khi được yêu cầu`,
    `- NGHIÊM CẤM sử dụng bất kỳ emoji hoặc biểu tượng nào trong văn bản trả về. Chỉ trả về văn bản chữ thuần túy.`,
  ];

  // 1. Vị trí địa lý (Spatial Context)
  if (context.locationContext) {
    const { district, ward, coords } = context.locationContext;
    let locStr = `Ngữ cảnh vị trí hiện tại của người dùng: `;
    if (ward) locStr += `Phường/Xã ${ward}, `;
    if (district) locStr += `Quận/Huyện ${district}, `;
    locStr += `Cần Thơ.`;
    parts.push(`\n${locStr}`);
    if (coords) {
      parts.push(`Tọa độ GPS hiện tại: ${coords.latitude}, ${coords.longitude}`);
    }
  } else {
    if (context.currentCity) {
      parts.push(`\nNgữ cảnh vị trí: Tỉnh/Thành phố — ${context.currentCity}`);
    }
    if (context.currentCoords?.latitude && context.currentCoords?.longitude) {
      parts.push(`Tọa độ GPS: ${context.currentCoords.latitude}, ${context.currentCoords.longitude}`);
    }
  }

  // 2. Thời gian (Time-aware Context)
  let timeOfDay = context.timeOfDay;
  if (!timeOfDay) {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) timeOfDay = "Buổi sáng";
    else if (hour >= 11 && hour < 14) timeOfDay = "Buổi trưa";
    else if (hour >= 14 && hour < 18) timeOfDay = "Buổi chiều";
    else timeOfDay = "Buổi tối";
  }
  parts.push(`Thời điểm hiện tại: ${timeOfDay}`);

  // 3. Sở thích (Travel Preferences Context)
  if (context.travelPreferences) {
    const prefs = context.travelPreferences;
    const prefParts = [];
    if (prefs.travelStyles && prefs.travelStyles.length > 0) {
      prefParts.push(`Gu du lịch: ${prefs.travelStyles.join(", ")}`);
    }
    if (prefs.budget) {
      prefParts.push(`Ngân sách dự tính: ${prefs.budget}`);
    }
    if (prefs.notes) {
      prefParts.push(`Ghi chú cá nhân: ${prefs.notes}`);
    }
    if (prefParts.length > 0) {
      parts.push(`\nThông tin sở thích của người dùng để cá nhân hóa gợi ý:\n${prefParts.join("\n")}`);
    }
  } else if (context.preferences?.travelStyles?.length) {
    parts.push(`Sở thích: ${context.preferences.travelStyles.join(", ")}`);
  }

  if (context.visitedPlaceIds?.length) {
    parts.push(`Đã xem: ${context.visitedPlaceIds.slice(-5).join(", ")}`);
  }

  // 4. RAG Places Context từ DB (Dạng văn bản rõ ràng cho LLM)
  if (Array.isArray(context.systemPlaces) && context.systemPlaces.length > 0) {
    const allowedNames = context.systemPlaces.map((p) => `"${p.name}"`).join(", ");
    const formattedPlaceLines = context.systemPlaces.map((p) => {
      let line = `- ID ${p.id}: "${p.name}" (Danh mục: ${p.categoryName || p.category?.name || "Địa điểm"}`;
      if (p.address) line += `, Địa chỉ: ${p.address}`;
      const priceStr = formatPriceRange(p.priceFrom, p.priceTo);
      if (priceStr) line += `, Giá: ${priceStr}`;
      if (p.ratingAvg) line += `, Đánh giá: ${p.ratingAvg}/5`;
      if (p.shortDescription) line += `, Mô tả: ${p.shortDescription.substring(0, 80)}`;
      line += `)`;
      return line;
    }).join("\n");

    parts.push(
      `\nQUY TẮC CHỐNG BỊA ĐẶT KHẮC NGHIỆT (ZERO HALLUCINATION):`,
      `DANH SÁCH TÊN ĐỊA ĐIỂM DUY NHẤT ĐƯỢC PHÉP NHẮC TỚI: [ ${allowedNames} ]`,
      `TUYỆT ĐỐI KHÔNG TỰ NÓI HOẶC BỊA BẤT KỲ TÊN QUÁN/ĐỊA ĐIỂM NÀO KHÁC BÊN NGOÀI DANH SÁCH TRÊN (ví dụ: không được bịa "Quán bún Cái Bè", "Quán bún Bè", hay bất kỳ quán nào không có trong danh sách trên).`,
      `Nếu người dùng hỏi món ăn/quán mà trong CSDL không có, hãy trả lời thẳng thắn: "Hiện tại Genie chưa có thông tin quán này trong hệ thống Cần Thơ nè" và gợi ý 1 trong các quán có sẵn trong danh sách CSDL dưới đây.`,
      `\nDANH SÁCH CHI TIẾT ĐỊA ĐIỂM CSDL:`,
      formattedPlaceLines,
      `\nKhi gợi ý địa điểm từ danh sách trên, LUÔN đính kèm dòng: [PLACES: id1, id2, ...] ở cuối câu trả lời.`,
    );
  } else {
    parts.push(
      `\nQUY TẮC CHỐNG BỊA ĐẶT: Hiện tại CSDL chưa có địa điểm nào phù hợp. Bạn KHÔNG ĐƯỢC BỊA NÓI bất kỳ tên quán/địa điểm nào. Hãy thông báo: "Genie chưa tìm thấy địa điểm phù hợp trong CSDL nè" và hỏi lại nhu cầu của người dùng.`,
    );
  }

  parts.push(`\nLƯU Ý BẮT BUỘC CUỐI CÙNG: Không bao giờ nhắc đến bất kỳ tên địa điểm nào nằm ngoài danh sách CSDL trên.`);

  return parts.join("\n");
}

/**
 * Send a chat completion request to Groq.
 * @param {Array<{role: string, content: string}>} messages
 * @param {Object} context - User context for system prompt
 * @returns {Promise<{ reply: string, suggestedPlaceIds: Array }>}
 */
export async function chatWithGroq(
  messages,
  context = {},
  providerOptions = {},
) {
  const {
    model,
    temperature,
    topP,
    maxTokens,
    timeoutMs,
    configuredPrompt,
  } = providerOptions;
  const systemPrompt = buildGroqSystemPrompt(context, configuredPrompt);
  const normalizedMessages = normalizeProviderMessages(messages);
  const startedAt = Date.now();
  let completion;

  try {
    const client = createGroqClient(providerOptions);
    completion = await client.chat.completions.create(
      {
        model,
        messages: [{ role: "system", content: systemPrompt }, ...normalizedMessages],
        temperature,
        top_p: topP,
        max_tokens: maxTokens,
      },
      { timeout: timeoutMs },
    );
  } catch (error) {
    const aiError = toAiServiceError(error);
    logAiProviderEvent({
      feature: "chat",
      model,
      startedAt,
      code: aiError.code,
    });
    throw aiError;
  }

  const replyText = completion.choices[0]?.message?.content || "";
  logAiProviderEvent({
    feature: "chat",
    model,
    startedAt,
    completion,
  });

  // Extract [PLACES: id1, id2] tag from response
  let finalReply = replyText;
  let suggestedPlaceIds = [];
  const placesRegex = /\[PLACES:\s*([\d\s,]+)\]/i;
  const match = replyText.match(placesRegex);
  if (match) {
    suggestedPlaceIds = match[1]
      .split(",")
      .map((idStr) => parseInt(idStr.trim(), 10))
      .filter((id) => !isNaN(id));
    finalReply = replyText.replace(placesRegex, "").trim();
  }

  return {
    reply: finalReply,
    suggestedPlaceIds,
    inputTokens: completion.usage?.prompt_tokens ?? null,
    outputTokens: completion.usage?.completion_tokens ?? null,
  };
}

export { buildGroqSystemPrompt };
