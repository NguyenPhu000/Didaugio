/**
 * Cấu trúc cài đặt hệ thống thực tế cho Hệ sinh thái Du lịch Thông minh Cần Thơ (iPoint Genie).
 * Tất cả các thông số đều liên kết trực tiếp với nghiệp vụ vận hành, thanh toán, AI và GIS.
 */
export const DEFAULT_SYSTEM_SETTINGS = {
  // 1. Nghiệp vụ vận hành đặt chỗ & thanh toán đối tác
  operations: {
    defaultCommissionRate: 10, // % hoa hồng nền tảng mặc định trên mỗi đơn đặt chỗ
    paymentTimeoutMinutes: 15, // Thời gian hết hạn thanh toán SePay VietQR (phút)
    minPayoutAmount: 200000, // Số tiền tối thiểu đối tác được tạo yêu cầu rút (VND)
    autoApprovePlaces: false, // Tự động duyệt địa điểm mới từ đối tác
    autoApproveReviews: true, // Tự động duyệt đánh giá của du khách
  },

  // 2. Cấu hình AI Engine (Groq Llama 3 & Gemini 1.5)
  ai: {
    enabled: true, // Bật/tắt toàn bộ dịch vụ trợ lý du lịch AI Genie
    primaryProvider: "groq", // "groq" (Fast Llama 3) hoặc "gemini" (Gemini 1.5 Flash)
    autoFallback: true, // Tự động chuyển đổi sang Gemini khi Groq rate-limit
    temperature: 0.7, // Độ sáng tạo của AI khi sinh lịch trình (0.2 - 1.0)
    maxTripDays: 5, // Số ngày tối đa khi gợi ý lịch trình khám phá Cần Thơ (1 - 7)
  },

  // 3. Cấu hình Bản đồ số & Không gian địa lý Cần Thơ (GIS MapLibre)
  map: {
    defaultRadiusKm: 5, // Bán kính quét địa điểm gần đây mặc định (km)
    centerLat: 10.0342, // Vĩ độ trung tâm Bến Ninh Kiều, Cần Thơ
    centerLng: 105.7876, // Kinh độ trung tâm Bến Ninh Kiều, Cần Thơ
    defaultZoom: 13, // Mức zoom mặc định khi mở bản đồ
    showWardBoundaries: true, // Hiển thị ranh giới 9 quận/huyện Cần Thơ
  },

  // 4. Trạng thái nền tảng & Bảo trì
  system: {
    maintenanceMode: false, // Chế độ bảo trì (chặn du khách truy cập)
    maintenanceMessage: "Hệ thống iPoint Genie đang bảo trì định kỳ để nâng cấp hạ tầng. Quý khách vui lòng quay lại sau.",
  },

  // 5. Nhật ký & Tình trạng hệ thống
  logs: {
    recentLogs: [],
    errorCount: 0,
    uptime: "99.98%",
  },
};
