/**
 * groq.service.js — Groq Cloud AI integration.
 * Uses the official Groq SDK.
 */
import Groq from "groq-sdk";
import logger from "../../config/logger.js";
import { resolveProviderSecret } from "../adminAi/aiCredential.service.js";
import { renderConfiguredPrompt } from "../../lib/promptBuilder.js";
import {
  logAiProviderEvent,
  normalizeProviderMessages,
  toAiServiceError,
} from "./aiProviderPolicy.js";

// Pre-compiled Regular Expressions for better performance
const REGEX_EXTRACT_PLACES = /[\(\[\{]\s*(?:PLACES?|PLACE_ID|ID)\s*:\s*([\d\s,]+)\s*[\)\]\}]/gi;
const REGEX_STRIP_TAGS = /[\(\[\{]\s*(?:PLACES?|PLACE_ID|PLACES_ID|MÃ_ID|MÃ|ID)\s*:\s*[\d\s,]+\s*[\)\]\}]/gi;
const REGEX_STRIP_PARENS = /[\(\[\{]\s*(?:MÃ\s*ID|PLACE\s*ID|PLACES?|MÃ|ID)?\s*#?\s*:?\s*[\d\s,]+\s*[\)\]\}]/gi;
const REGEX_STRIP_BARE_ID = /\b(?:MÃ\s*ID|PLACE\s*ID|PLACES?|MÃ|ID)\s*#?\s*:?\s*\d+\b/gi;
const REGEX_STRIP_EMPTY_PARENS = /[\(\[\{]\s*[\)\]\}]/g;
const REGEX_MULTIPLE_SPACES = / {2,}/g;
const REGEX_SPLIT_KEYS = /[\n,;]+/;

export function createGroqClient({ apiKey, baseUrl = "https://api.groq.com" } = {}) {
  if (!apiKey) {
    throw Object.assign(new Error("Groq credential is unavailable."), {
      code: "AI_SECRET_UNAVAILABLE",
      errorCode: "AI_SECRET_UNAVAILABLE",
      statusCode: 503,
    });
  }
  return new Groq({ apiKey, baseURL: baseUrl });
}

export function parseApiKeyPool(secretString) {
  if (!secretString || typeof secretString !== "string") return [];
  return secretString
    .split(REGEX_SPLIT_KEYS)
    .map((k) => k.trim())
    .filter(Boolean);
}

export async function resolveGroqProviderOptions(configData, feature) {
  const apiKeySecret = await resolveProviderSecret(configData.provider.secretReference);
  const apiKeys = parseApiKeyPool(apiKeySecret);
  
  return {
    apiKey: apiKeys[0] || "",
    apiKeys,
    baseUrl: configData.provider.baseUrl,
    model: configData.provider.model,
    temperature: configData.modelParameters.temperature,
    topP: configData.modelParameters.topP,
    maxTokens: configData.modelParameters.maxTokens,
    timeoutMs: configData.modelParameters.timeoutMs,
    configuredPrompt: configData.prompts[feature],
  };
}

export async function executeGroqCompletionWithPool(providerOptions, executionCallback) {
  const keys = providerOptions?.apiKeys?.length > 0
    ? providerOptions.apiKeys
    : [providerOptions?.apiKey].filter(Boolean);

  if (!keys.length) {
    const client = createGroqClient(providerOptions);
    return executionCallback(client);
  }

  let lastError;
  for (let i = 0; i < keys.length; i++) {
    try {
      const client = createGroqClient({ ...providerOptions, apiKey: keys[i] });
      return await executionCallback(client);
    } catch (error) {
      lastError = toAiServiceError(error);
      const isRateLimit =
        lastError.code === "QUOTA_EXCEEDED" ||
        lastError.statusCode === 429 ||
        error?.status === 429;

      if (isRateLimit && i < keys.length - 1) {
        logger.info(
          `[Groq Key Pool] Key #${i + 1} hit rate limit (${lastError.code}). Rotating to Key #${i + 2}...`
        );
        continue;
      }
      throw lastError; // Ném lỗi nếu không phải rate limit hoặc đã hết key
    }
  }
  throw lastError;
}

/**
 * Format price range to human-readable Vietnamese string.
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
      return Number.isInteger(millions) ? `${millions} triệu` : `${millions.toFixed(1)} triệu`;
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
    `- Nếu người dùng yêu cầu số lượng cụ thể (ví dụ: "gợi ý 10 chỗ"), hãy gợi ý ĐÚNG số lượng đó từ danh sách CSDL. Nếu người dùng không chỉ định số lượng, hãy gợi ý 3-5 chỗ cụ thể kèm GIÁ THẬT từ dữ liệu, KHÔNG nói chung chung`,
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
    const locParts = ["Ngữ cảnh vị trí hiện tại của người dùng:"];
    if (ward) locParts.push(`Phường/Xã ${ward},`);
    if (district) locParts.push(`Quận/Huyện ${district},`);
    locParts.push("Cần Thơ.");
    
    parts.push(`\n${locParts.join(" ")}`);
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
    timeOfDay = hour < 5 ? "Buổi tối" : hour < 11 ? "Buổi sáng" : hour < 14 ? "Buổi trưa" : hour < 18 ? "Buổi chiều" : "Buổi tối";
  }
  parts.push(`Thời điểm hiện tại: ${timeOfDay}`);

  // 3. Sở thích (Travel Preferences Context)
  if (context.travelPreferences) {
    const { travelStyles, budget, notes } = context.travelPreferences;
    const prefParts = [];
    
    if (travelStyles?.length) prefParts.push(`Gu du lịch: ${travelStyles.join(", ")}`);
    if (budget) prefParts.push(`Ngân sách dự tính: ${budget}`);
    if (notes) prefParts.push(`Ghi chú cá nhân: ${notes}`);
    
    if (prefParts.length) {
      parts.push(`\nThông tin sở thích của người dùng để cá nhân hóa gợi ý:\n${prefParts.join("\n")}`);
    }
  } else if (context.preferences?.travelStyles?.length) {
    parts.push(`Sở thích: ${context.preferences.travelStyles.join(", ")}`);
  }

  if (context.visitedPlaceIds?.length) {
    parts.push(`Đã xem: ${context.visitedPlaceIds.slice(-5).join(", ")}`);
  }

  // 4. RAG Places Context từ DB (Đã fix lỗi bị thiếu formattedPlaceLines)
  if (Array.isArray(context.systemPlaces) && context.systemPlaces.length > 0) {
    const allowedNames = context.systemPlaces.map((p) => `"${p.name}"`).join(", ");
    const formattedPlaceLines = context.systemPlaces.map((p) => {
      const category = p.categoryName || p.category?.name || "Địa điểm";
      let line = `- ID ${p.id}: "${p.name}" (Danh mục: ${category}`;
      if (p.address) line += `, Địa chỉ: ${p.address}`;
      
      const priceStr = formatPriceRange(p.priceFrom, p.priceTo);
      if (priceStr) line += `, Giá: ${priceStr}`;
      if (p.ratingAvg) line += `, Đánh giá: ${p.ratingAvg}/5`;
      if (p.shortDescription) line += `, Mô tả: ${p.shortDescription.substring(0, 80)}`;
      
      return line + `)`;
    }).join("\n");

    parts.push(
      `\nQUY TẮC CHỐNG BỊA ĐẶT KHẮC NGHIỆT (ZERO HALLUCINATION):`,
      `DANH SÁCH TÊN ĐỊA ĐIỂM DUY NHẤT ĐƯỢC PHÉP NHẮC TỚI: [ ${allowedNames} ]`,
      `TUYỆT ĐỐI KHÔNG TỰ NÓI HOẶC BỊA BẤT KỲ TÊN QUÁN/ĐỊA ĐIỂM NÀO KHÁC BÊN NGOÀI DANH SÁCH TRÊN (ví dụ: không được bịa "Quán bún Cái Bè", "Quán bún Bè", hay bất kỳ quán nào không có trong danh sách trên).`,
      `Nếu người dùng hỏi món ăn/quán mà trong CSDL không có, hãy trả lời thẳng thắn: "Hiện tại Genie chưa có thông tin quán này trong hệ thống Cần Thơ nè" và gợi ý 1 trong các quán có sẵn trong danh sách CSDL dưới đây.`,
      `\nDANH SÁCH CHI TIẾT ĐỊA ĐIỂM CSDL:\n${formattedPlaceLines}`,
      `\nQUY TẮC HIỂN THỊ MÃ ID: TUYỆT ĐỐI CẤM VIẾT BẤT KỲ MÃ ID NÀO (như (PLACES:254), [PLACES:254], ID 240, (ID 240), mã 240...) VÀO TRONG NỘI DUNG VĂN BẢN TRẢ LỜI NGƯỜI DÙNG.`,
      `Khi gợi ý địa điểm từ danh sách trên, CHỈ ĐÍNH KÈM DUY NHẤT DÒNG HỆ THỐNG: [PLACES: id1, id2, ...] Ở DÒNG CUỐI CÙNG VÀ NGOÀI RA KHÔNG VIẾT MÃ ID Ở BẤT KỲ ĐÂU KHÁC.`
    );
  } else {
    parts.push(
      `\nQUY TẮC CHỐNG BỊA ĐẶT: Hiện tại CSDL chưa có địa điểm nào phù hợp. Bạn KHÔNG ĐƯỢC BỊA NÓI bất kỳ tên quán/địa điểm nào. Hãy thông báo: "Genie chưa tìm thấy địa điểm phù hợp trong CSDL nè" và hỏi lại nhu cầu của người dùng.`
    );
  }

  parts.push(`\nLƯU Ý BẮT BUỘC CUỐI CÙNG: Không bao giờ nhắc đến bất kỳ tên địa điểm nào nằm ngoài danh sách CSDL trên.`);

  return parts.join("\n");
}

/**
 * Send a chat completion request to Groq.
 */
export async function chatWithGroq(messages, context = {}, providerOptions = {}) {
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
    completion = await executeGroqCompletionWithPool(
      providerOptions,
      (client) => client.chat.completions.create(
        {
          model,
          messages: [{ role: "system", content: systemPrompt }, ...normalizedMessages],
          temperature,
          top_p: topP,
          max_tokens: maxTokens,
        },
        { timeout: timeoutMs }
      )
    );
  } catch (error) {
    const aiError = toAiServiceError(error);
    logAiProviderEvent({ feature: "chat", model, startedAt, code: aiError.code });
    throw aiError;
  }

  const replyText = completion.choices[0]?.message?.content || "";
  
  logAiProviderEvent({
    feature: "chat",
    model,
    startedAt,
    completion,
  });

  // Extract [PLACES: id1, id2] seamlessly with matchAll
  const suggestedPlaceIds = [];
  for (const match of replyText.matchAll(REGEX_EXTRACT_PLACES)) {
    match[1].split(",").forEach((idStr) => {
      const id = parseInt(idStr.trim(), 10);
      if (!isNaN(id)) suggestedPlaceIds.push(id);
    });
  }

  // Strip ALL ID variations efficiently
  const finalReply = replyText
    .replace(REGEX_STRIP_TAGS, "")
    .replace(REGEX_STRIP_PARENS, "")
    .replace(REGEX_STRIP_BARE_ID, "")
    .replace(REGEX_STRIP_EMPTY_PARENS, "")
    .replace(REGEX_MULTIPLE_SPACES, " ")
    .trim();

  return {
    reply: finalReply,
    suggestedPlaceIds: [...new Set(suggestedPlaceIds)],
    inputTokens: completion.usage?.prompt_tokens ?? null,
    outputTokens: completion.usage?.completion_tokens ?? null,
  };
}

export { buildGroqSystemPrompt };
