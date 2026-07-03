import { createGroqClient, GROQ_MODEL } from "./groq.service.js";
import { parseAiJsonObject } from "./aiJsonParser.js";

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Gọi AI sắp xếp thứ tự và lập kế hoạch ngân sách dựa trên danh sách địa điểm thật từ DB
 * @param {Object} coords Tọa độ hiện tại của user
 * @param {Object} preferences Sở thích du lịch từ profile
 * @param {Array} places Danh sách các địa điểm gần nhất lấy từ DB
 * @returns {Promise<Object>} Lịch trình và dự toán chi phí sạch
 */
export async function generateHybridPlan(coords, preferences, places) {
  if (!Array.isArray(places) || places.length === 0) {
    throw new Error("Danh sách địa điểm đầu vào trống.");
  }

  const client = createGroqClient();

  // Helper format giá readable
  const fmtPrice = (v) => {
    if (!v || v <= 0) return null;
    if (v >= 1_000_000) {
      const m = v / 1_000_000;
      return m % 1 === 0 ? `${m} triệu` : `${m.toFixed(1)} triệu`;
    }
    return `${Math.round(v / 1000)}k`;
  };

  // Rút gọn địa điểm để tiết kiệm token và định hướng AI
  const placesContext = places.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.categoryName || "Địa điểm",
    rating: p.ratingAvg,
    priceFrom: p.priceFrom || 0,
    priceTo: p.priceTo || 0,
    priceReadable: p.priceFrom && p.priceTo
      ? `${fmtPrice(p.priceFrom)} - ${fmtPrice(p.priceTo)}`
      : "Chưa cập nhật",
  }));

  const systemPrompt = `Bạn là "Genie" — trợ lý du lịch của ứng dụng "iPoint Genie".
Nhiệm vụ: sắp xếp lịch trình du lịch trong ngày thông minh, tối ưu tuyến đường, và ước lượng chi phí dựa trên danh sách địa điểm có thật từ cơ sở dữ liệu.

QUY TẮC BẮT BUỘC:
1. CHỈ sử dụng các địa điểm trong danh sách đầu vào. KHÔNG tự bịa địa điểm bên ngoài.
2. Sắp xếp tuyến đường tối ưu để tiết kiệm khoảng cách di chuyển.
3. Dự toán chi phí dựa trên khoảng giá (priceFrom, priceTo) THẬT của từng địa điểm. Sử dụng giá chính xác từ dữ liệu, KHÔNG dùng số tiền cố định.
4. Nếu người dùng có ngân sách thấp, ưu tiên gợi ý địa điểm có giá thấp hơn trong danh sách.
5. Time slot linh hoạt: dùng "Sáng sớm" (5-7h), "Sáng" (7-10h), "Trưa" (11-13h), "Chiều" (14-17h), "Chiều tối" (17-19h), "Tối" (19-22h) — tùy theo thời điểm bắt đầu và số lượng địa điểm.
6. Trả về JSON sạch theo schema dưới đây, KHÔNG kèm giải thích bên ngoài.
7. KHÔNG sử dụng emoji hoặc biểu tượng trong bất kỳ chuỗi nào.

ĐỊNH DẠNG GIÁ:
- Giá dưới 1 triệu: viết "120k", "250k"
- Giá từ 1 triệu: viết "1.5 triệu", "2 triệu"
- KHÔNG viết "120000đ" — rất khó đọc

SCHEMA JSON:
{
  "tripSummary": {
    "totalEstimatedPriceFrom": number,
    "totalEstimatedPriceTo": number,
    "currency": "VND",
    "costBreakdown": {
      "food": { "from": number, "to": number },
      "tickets": { "from": number, "to": number },
      "transportEstimated": { "from": number, "to": number }
    }
  },
  "timeline": [
    {
      "timeSlot": "string (một trong: Sáng sớm, Sáng, Trưa, Chiều, Chiều tối, Tối)",
      "placeId": number (ID khớp đúng từ danh sách đầu vào),
      "reason": "Giải thích ngắn gọn, tự nhiên, tiếng Việt miền Nam, xưng Genie, không emoji"
    }
  ]
}`;

  const budgetHint = preferences?.budget
    ? `\nNgân sách của người dùng: ${preferences.budget} — ưu tiên địa điểm trong khoảng giá này.`
    : "";

  const userPrompt = `Tọa độ hiện tại: ${coords ? `${coords.latitude}, ${coords.longitude}` : "Chưa có"}
Sở thích du lịch: ${preferences ? JSON.stringify(preferences) : "Chưa có"}${budgetHint}
Danh sách địa điểm từ DB (có priceReadable để tham khảo nhanh):
${JSON.stringify(placesContext)}

Hãy chọn 3-4 địa điểm phù hợp nhất, sắp xếp tuyến đường tối ưu, và trả về JSON chuẩn.`;

  const completion = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2, // Nhiệt độ thấp để đảm bảo output định dạng JSON chính xác
    max_tokens: 2000,
  });

  const rawText = completion.choices[0]?.message?.content || "";

  let planData;
  try {
    planData = parseAiJsonObject(rawText);
  } catch (err) {
    console.error("[Groq JSON Parsing Failed] Raw Text:", rawText);
    throw new Error("Không thể parse dữ liệu lịch trình từ AI.");
  }

  // Validate cấu trúc cơ bản
  if (!planData.tripSummary || !Array.isArray(planData.timeline)) {
    throw new Error("Dữ liệu lịch trình từ AI sai cấu trúc yêu cầu.");
  }

  // 2. Tính toán khoảng cách địa lý (Haversine) và thời gian di chuyển thực tế tại Server
  const timeline = planData.timeline;
  for (let i = 0; i < timeline.length; i++) {
    const currentItem = timeline[i];
    const nextItem = timeline[i + 1];

    // Lấy thông tin tọa độ địa điểm hiện tại từ danh sách DB ban đầu
    const currentPlace = places.find((p) => p.id === currentItem.placeId);
    currentItem.place = currentPlace || null;

    if (nextItem) {
      const nextPlace = places.find((p) => p.id === nextItem.placeId);
      if (currentPlace && nextPlace && currentPlace.latitude && currentPlace.longitude && nextPlace.latitude && nextPlace.longitude) {
        const dist = calculateHaversineDistance(
          parseFloat(currentPlace.latitude),
          parseFloat(currentPlace.longitude),
          parseFloat(nextPlace.latitude),
          parseFloat(nextPlace.longitude)
        );

        // Uớc lượng thời gian di chuyển đi xe máy trong thành phố (trung bình 30km/h => 1km khoảng 2 phút, cộng thêm kẹt xe/chờ đèn đỏ => nhân 2.5)
        const duration = Math.max(1, Math.round(dist * 2.5));

        currentItem.navigationToNext = {
          distanceKm: parseFloat(dist.toFixed(1)),
          durationMin: duration,
        };
      } else {
        currentItem.navigationToNext = null;
      }
    } else {
      currentItem.navigationToNext = null; // Chặng cuối cùng
    }
  }

  return {
    tripSummary: planData.tripSummary,
    timeline: timeline,
  };
}
