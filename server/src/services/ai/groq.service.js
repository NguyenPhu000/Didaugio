/**
 * groq.service.js — Groq Cloud AI integration.
 * Uses the official Groq SDK.
 */
import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL_NAME || "meta-llama/llama-4-scout-17b-16e-instruct";

function createGroqClient() {
  if (!GROQ_API_KEY) {
    throw new Error("[ENV] Thiếu GROQ_API_KEY — vui lòng cấu hình trong .env");
  }
  return new Groq({ apiKey: GROQ_API_KEY, baseURL: "https://api.groq.com" });
}

/**
 * Build system prompt for the travel assistant persona with user context.
 * @param {Object} context
 * @param {string} [context.currentCity]
 * @param {{ latitude: number, longitude: number }} [context.currentCoords]
 * @param {Array} [context.systemPlaces] - RAG places from DB
 */
function buildGroqSystemPrompt(context = {}) {
  const parts = [
    `Bạn là "em Nhi" — trợ lý du lịch ảo thông minh của ứng dụng "Đi Đâu Giờ?", thân thiện như người bạn địa phương.`,
    `Nhiệm vụ: tư vấn lịch trình, gợi ý quán ăn, điểm check-in một cách ngắn gọn, hữu ích và chính xác.`,
    ``,
    `Nguyên tắc bắt buộc:`,
    `- Dùng ngôn ngữ tự nhiên miền Nam (nhẹ nhàng, không quá nặng)`,
    `- Hay dùng "nè", "đó", "ha", "nghen" ở cuối câu khi phù hợp`,
    `- Khi giới thiệu địa điểm: bắt đầu bằng 1 câu ấn tượng nhất`,
    `- Đọc như đang kể chuyện, KHÔNG đọc bullet point dài`,
    `- Nếu không biết → thành thật, KHÔNG bịa đặt`,
    `- Trả lời bằng tiếng Việt trừ khi được yêu cầu`,
    `- Câu trả lời ngắn gọn, xuống dòng rõ ràng, phù hợp hiển thị trên màn hình chat điện thoại`,
  ];

  if (context.currentCity) {
    parts.push(`\nNgữ cảnh vị trí: Tỉnh/Thành phố — ${context.currentCity}`);
  }
  if (context.currentCoords?.latitude && context.currentCoords?.longitude) {
    parts.push(`Tọa độ GPS: ${context.currentCoords.latitude}, ${context.currentCoords.longitude}`);
  }
  if (context.timeOfDay) {
    parts.push(`Thời điểm: ${context.timeOfDay}`);
  }

  if (Array.isArray(context.systemPlaces) && context.systemPlaces.length > 0) {
    const minifiedPlaces = context.systemPlaces.map((p) => ({
      i: p.id,
      n: p.name,
      c: p.category?.name || "Địa điểm",
      a: p.address || "",
      r: p.ratingAvg ? Number(p.ratingAvg) : 0,
      p: p.priceFrom && p.priceTo ? `${p.priceFrom}đ - ${p.priceTo}đ` : "Chưa cập nhật",
      d: p.description ? p.description.substring(0, 120) : "",
    }));
    parts.push(
      `\nQUAN TRỌNG: Bạn CHỈ ĐƯỢC PHÉP giới thiệu/gợi ý các địa điểm có trong danh sách dưới đây. Tuyệt đối KHÔNG tự ý bịa tên hoặc lấy địa điểm khác bên ngoài. Nếu khách hỏi địa điểm ngoài danh sách, hãy trả lời lịch sự rằng "Hiện tại hệ thống Đi Đâu Giờ chưa cập nhật địa điểm này" và gợi ý sang địa điểm có sẵn.`,
      `Danh sách địa điểm (JSON: i=ID, n=Tên, c=Danh mục, a=Địa chỉ, r=Rating, p=Giá, d=Mô tả ngắn):`,
      JSON.stringify(minifiedPlaces),
      `\nKhi gợi ý địa điểm, LUÔN kết thúc bằng dòng: [PLACES: id1, id2, ...]`,
    );
  }

  if (context.preferences?.travelStyles?.length) {
    parts.push(`Sở thích: ${context.preferences.travelStyles.join(", ")}`);
  }
  if (context.visitedPlaceIds?.length) {
    parts.push(`Đã xem: ${context.visitedPlaceIds.slice(-5).join(", ")}`);
  }

  return parts.join("\n");
}

/**
 * Send a chat completion request to Groq.
 * @param {Array<{role: string, content: string}>} messages
 * @param {Object} context - User context for system prompt
 * @returns {Promise<{ reply: string, relatedPlaces: Array }>}
 */
export async function chatWithGroq(messages, context = {}) {
  const client = createGroqClient();
  const systemPrompt = buildGroqSystemPrompt(context);

  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    temperature: 0.6,
    max_tokens: 1500,
  });

  const replyText = completion.choices[0]?.message?.content || "";

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

  return { reply: finalReply, suggestedPlaceIds };
}

export { buildGroqSystemPrompt, createGroqClient, GROQ_MODEL };
