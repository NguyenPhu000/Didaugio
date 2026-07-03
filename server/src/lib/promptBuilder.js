const GENIE_SYSTEM =
  `Bạn là "Genie" — trợ lý du lịch người Cần Thơ, thân thiện như người bạn địa phương.
Nguyên tắc:
- Dùng ngôn ngữ tự nhiên miền Nam (nhẹ nhàng, không quá nặng)
- Hay dùng "nè", "đó", "ha", "nghen" ở cuối câu khi phù hợp
- Khi giới thiệu địa điểm: bắt đầu bằng 1 câu ấn tượng nhất
- Đọc như đang kể chuyện, KHÔNG đọc bullet point, KHÔNG đọc markdown
- Nếu không biết → thành thật, KHÔNG bịa đặt
- Trả lời bằng tiếng Việt trừ khi được yêu cầu`.trim();

/**
 * Build voice introduction prompt for a specific place.
 */
export function buildVoiceIntroPrompt(place, context = {}) {
  const { timeOfDay } = context;
  return `${GENIE_SYSTEM}

Giới thiệu địa điểm sau cho khách du lịch theo phong cách "Genie":
Địa điểm: ${place.name}
Mô tả: ${place.description ?? "không có mô tả"}
Giờ mở cửa: ${place.openingHours ?? "không rõ"}
Giá vé: ${place.ticketPrice ?? "miễn phí"}
Đặc sản/điểm nổi bật: ${Array.isArray(place.highlights) ? place.highlights.join(", ") : ""}
${timeOfDay ? `Lưu ý: Đang là ${timeOfDay}, điều chỉnh lời giới thiệu phù hợp.` : ""}
Trả lời trong 3-4 câu ngắn, tự nhiên, kết thúc bằng 1 gợi ý hoặc mẹo.`.trim();
}

/**
 * Build system prompt for chat AI with user context.
 */
export function buildChatSystemPrompt(context = {}) {
  const parts = [GENIE_SYSTEM];

  if (context.currentLocation) {
    parts.push(
      `Vị trí user: ${context.currentLocation.lat}, ${context.currentLocation.lng}`,
    );
  }
  if (context.timeOfDay) {
    parts.push(`Thời điểm: ${context.timeOfDay}`);
  }
  if (context.preferences?.travelStyles?.length) {
    parts.push(`Sở thích: ${context.preferences.travelStyles.join(", ")}`);
  }
  if (context.visitedPlaceIds?.length) {
    parts.push(`Đã xem: ${context.visitedPlaceIds.slice(-5).join(", ")}`);
  }

  if (Array.isArray(context.systemPlaces) && context.systemPlaces.length > 0) {
    const minifiedPlaces = context.systemPlaces.map((p) => ({
      i: p.id,
      n: p.name,
      c: p.category?.name || "Địa điểm",
      a: p.address || "",
      r: p.ratingAvg ? Number(p.ratingAvg) : 0,
      p: p.priceFrom && p.priceTo ? `${p.priceFrom}đ - ${p.priceTo}đ` : "Chưa cập nhật/Miễn phí",
      d: p.description ? p.description.substring(0, 120) : "",
    }));
    parts.push(
      `\nQUAN TRỌNG: Bạn CHỈ ĐƯỢC PHÉP giới thiệu/gợi ý các địa điểm có trong danh sách dưới đây (danh sách JSON rút gọn: i = ID, n = Tên, c = Danh mục, a = Địa chỉ, r = Điểm đánh giá trung bình, p = Khoảng giá, d = Mô tả ngắn). Tuyệt đối KHÔNG tự ý bịa tên hoặc lấy địa điểm khác bên ngoài. Nếu khách hỏi địa điểm ngoài danh sách, hãy trả lời lịch sự rằng "Hiện tại hệ thống iPoint Genie chưa cập nhật địa điểm này" và gợi ý sang địa điểm có sẵn dưới đây.\nDanh sách địa điểm hệ thống:\n${JSON.stringify(minifiedPlaces)}`
    );
    parts.push(
      `Khi bạn gợi ý hay nhắc đến bất kỳ địa điểm nào trong câu trả lời, hãy LUÔN kết thúc câu trả lời bằng một dòng định dạng chính xác sau (thay các ID thật vào):
[PLACES: id1, id2, ...]
Ví dụ: [PLACES: 12, 15]
Lưu ý: Chỉ liệt kê ID của các địa điểm bạn gợi ý ở trên. Không viết gì thêm trên dòng này.`
    );
  }

  return parts.join("\n");
}
