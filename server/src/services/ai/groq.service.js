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
function buildGroqSystemPrompt(context = {}) {
  const parts = [
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

  // 4. RAG Places Context từ DB
  if (Array.isArray(context.systemPlaces) && context.systemPlaces.length > 0) {
    const minifiedPlaces = context.systemPlaces.map((p) => {
      const entry = {
        i: p.id,
        n: p.name,
        c: p.categoryName || p.category?.name || "Địa điểm",
        a: p.address || "",
        r: p.ratingAvg ? Number(p.ratingAvg) : 0,
        p: formatPriceRange(p.priceFrom, p.priceTo),
      };
      if (p.shortDescription) entry.sd = p.shortDescription.substring(0, 80);
      if (p.distance != null) entry.dist = `${p.distance.toFixed(1)}km`;
      return entry;
    });

    // Nhóm địa điểm theo danh mục để AI dễ gợi ý theo loại
    const groupedByCategory = {};
    for (const p of minifiedPlaces) {
      if (!groupedByCategory[p.c]) groupedByCategory[p.c] = [];
      groupedByCategory[p.c].push(p);
    }

    parts.push(
      `\nQUAN TRỌNG: Bạn CHỈ ĐƯỢC PHÉP giới thiệu/gợi ý các địa điểm có trong danh sách dưới đây. Tuyệt đối KHÔNG tự ý bịa tên hoặc lấy địa điểm khác bên ngoài. Nếu khách hỏi địa điểm ngoài danh sách, hãy trả lời rằng "Hiện tại Genie chưa có thông tin địa điểm này nè" và gợi ý sang địa điểm có sẵn.`,
      `Danh sách địa điểm (i=ID, n=Tên, c=Danh mục, a=Địa chỉ, r=Rating 0-5, p=Giá đã format, sd=Mô tả ngắn, dist=Khoảng cách):`,
      JSON.stringify(minifiedPlaces),
      `\nNhóm theo danh mục:`,
      JSON.stringify(groupedByCategory),
      `\nKhi gợi ý địa điểm, LUÔN kết thúc bằng dòng: [PLACES: id1, id2, ...]`,
    );
  }

  return parts.join("\n");
}

/**
 * Send a chat completion request to Groq.
 * @param {Array<{role: string, content: string}>} messages
 * @param {Object} context - User context for system prompt
 * @returns {Promise<{ reply: string, suggestedPlaceIds: Array }>}
 */
export async function chatWithGroq(messages, context = {}) {
  const client = createGroqClient();
  const systemPrompt = buildGroqSystemPrompt(context);

  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    temperature: 0.6,
    max_tokens: 2000,
  });

  const replyText = completion.choices[0]?.message?.content || "";
  console.log("[Groq] Raw reply length:", replyText.length, "Preview:", replyText.substring(0, 150));
  console.log("[Groq] Choices:", completion.choices?.length, "Finish reason:", completion.choices[0]?.finish_reason);

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
