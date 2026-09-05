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
