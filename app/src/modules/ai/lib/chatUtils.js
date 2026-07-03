/** Định dạng giá hiển thị gọn: 120000 → "120k", 1500000 → "1.5 triệu" */
export function formatPrice(price) {
  const val = Number(price);
  if (!val || val <= 0) return "Miễn phí";
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)} triệu`;
  if (val >= 1000) return `${Math.round(val / 1000)}k`;
  return `${val}đ`;
}

/** Định dạng khoảng giá: "120k - 250k", "từ 50k", "~100k" */
export function formatPriceRange(from, to) {
  const f = Number(from);
  const t = Number(to);
  if (!f && !t) return "Chưa cập nhật";
  if (!f) return `~${formatPrice(t)}`;
  if (!t) return `từ ${formatPrice(f)}`;
  if (f === t) return formatPrice(f);
  return `${formatPrice(f)} - ${formatPrice(t)}`;
}

/** Lấy gợi ý nhanh dựa trên thời điểm trong ngày */
export function getTimeBasedSuggestions() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) {
    return [
      { text: "Quán ăn sáng ngon gần đây" },
      { text: "Cà phê sáng view đẹp Cần Thơ" },
      { text: "Lên lịch trình hôm nay từ sáng" },
      { text: "Bánh mì, phở gần trung tâm" },
    ];
  }
  if (hour >= 11 && hour < 14) {
    return [
      { text: "Quán ăn trưa ngon Ninh Kiều" },
      { text: "Cơm tấm, bún bò gần đây" },
      { text: "Nhà hàng hải sản Cần Thơ" },
      { text: "Lên lịch trình buổi chiều" },
    ];
  }
  if (hour >= 14 && hour < 18) {
    return [
      { text: "Quán cà phê view sông Cần Thơ" },
      { text: "Điểm chụp ảnh đẹp gần đây" },
      { text: "Lên lịch trình nửa ngày quanh đây" },
      { text: "Chợ nổi Cái Răng đi bằng gì" },
    ];
  }
  return [
    { text: "Quán ăn tối ngon Cần Thơ" },
    { text: "Điểm vui chơi buổi tối gần đây" },
    { text: "Quán nhậu, beer club Ninh Kiều" },
    { text: "Lịch trình ngày mai cho tôi" },
  ];
}

export function clientHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
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
