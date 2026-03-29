const CHI_MAI_SYSTEM = `Bạn là "Chị Mai" — trợ lý du lịch người Cần Thơ, thân thiện như người bạn địa phương.
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
  return `${CHI_MAI_SYSTEM}

Giới thiệu địa điểm sau cho khách du lịch theo phong cách "Chị Mai":
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
  const parts = [CHI_MAI_SYSTEM];

  if (context.currentLocation) {
    parts.push(`Vị trí user: ${context.currentLocation.lat}, ${context.currentLocation.lng}`);
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

  return parts.join("\n");
}
