/**
 * geminiService.js — Google Gemini integration for AI trip planning.
 * Uses @google/generative-ai SDK.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = "gemini-1.5-flash";

// ─── Itinerary generation ─────────────────────────────────────────────────────

/**
 * Build a structured prompt for trip itinerary generation.
 * @param {Object} preferences - User travel preferences
 * @param {Array}  places      - Available approved places from DB
 */
function buildItineraryPrompt(preferences, places) {
  const { totalDays, travelStyle, groupSize, budget, notes } = preferences;

  const placeList = places
    .slice(0, 40)
    .map(
      (p) =>
        `- ID:${p.id} | ${p.name} | Danh mục: ${p.category?.name || "?"} | ` +
        `Địa chỉ: ${p.address || p.ward?.name || "?"} | Rating: ${p.ratingAvg || 0}`,
    )
    .join("\n");

  return `Bạn là trợ lý du lịch thông minh cho Cần Thơ, Việt Nam.
Hãy tạo lịch trình du lịch Cần Thơ chi tiết dựa theo các thông tin sau:

**Thông tin chuyến đi:**
- Số ngày: ${totalDays || 1}
- Phong cách: ${travelStyle || "Tham quan chung"}
- Số người: ${groupSize || 1}
- Ngân sách ước tính: ${budget ? budget + " VNĐ/người" : "Không giới hạn"}
${notes ? `- Ghi chú: ${notes}` : ""}

**Danh sách địa điểm có thể chọn:**
${placeList}

**Yêu cầu output JSON (KHÔNG bao gồm markdown code block, chỉ JSON thuần):**
{
  "title": "Tên lịch trình",
  "description": "Mô tả ngắn về chuyến đi",
  "totalDays": <số ngày>,
  "estimatedCost": <tổng chi phí ước tính bằng VNĐ>,
  "days": [
    {
      "dayNumber": 1,
      "theme": "Chủ đề ngày 1",
      "destinations": [
        {
          "placeId": <id từ danh sách>,
          "order": 1,
          "startTime": "08:00",
          "endTime": "10:00",
          "durationMinutes": 120,
          "note": "Gợi ý trải nghiệm tại đây",
          "transportToNext": "xe máy",
          "estimatedCost": <chi phí VNĐ>
        }
      ]
    }
  ]
}

Chỉ dùng địa điểm có trong danh sách trên (dùng đúng ID). Trả về JSON hợp lệ, không giải thích thêm.`;
}

/**
 * Generate a trip itinerary via Gemini.
 * @param {Object} preferences
 * @param {Array}  places
 * @returns {{ raw: string, parsed: Object, tokensUsed: number, responseTimeMs: number }}
 */
export async function generateItinerary(preferences, places) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY không được cấu hình");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = buildItineraryPrompt(preferences, places);
  const start = Date.now();

  const result = await model.generateContent(prompt);
  const response = result.response;
  const raw = response.text().trim();
  const responseTimeMs = Date.now() - start;
  const tokensUsed = response.usageMetadata?.totalTokenCount ?? null;

  // Strip markdown code block if present
  const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(
      `Gemini trả về JSON không hợp lệ: ${jsonText.slice(0, 200)}`,
    );
  }

  return { raw, parsed, tokensUsed, responseTimeMs };
}
