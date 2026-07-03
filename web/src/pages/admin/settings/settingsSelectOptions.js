/**
 * Giá trị lưu trong DB giữ nguyên (chuỗi) — chỉ thêm lựa chọn thay vì gõ tay.
 */

export const LANGUAGE_OPTIONS = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

export const TIMEZONE_OPTIONS = [
  { value: "Asia/Ho_Chi_Minh", label: "Hồ Chí Minh (UTC+7)" },
  { value: "Asia/Bangkok", label: "Bangkok (UTC+7)" },
  { value: "Asia/Singapore", label: "Singapore (UTC+8)" },
  { value: "Asia/Tokyo", label: "Tokyo (UTC+9)" },
  { value: "UTC", label: "UTC" },
];

export const DATE_FORMAT_OPTIONS = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (Việt Nam)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (Mỹ)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
  { value: "DD-MM-YYYY", label: "DD-MM-YYYY" },
];

export const CURRENCY_OPTIONS = [
  { value: "VND", label: "VND — Đồng Việt Nam" },
  { value: "USD", label: "USD — Đô la Mỹ" },
  { value: "EUR", label: "EUR — Euro" },
];

export const BACKUP_FREQUENCY_OPTIONS = [
  { value: "hourly", label: "Mỗi giờ" },
  { value: "daily", label: "Mỗi ngày" },
  { value: "weekly", label: "Mỗi tuần" },
  { value: "monthly", label: "Mỗi tháng" },
];

export const ANALYTICS_PROVIDER_OPTIONS = [
  { value: "ga4", label: "Google Analytics 4" },
  { value: "gtm", label: "Google Tag Manager" },
  { value: "none", label: "Không dùng" },
  { value: "plausible", label: "Plausible" },
  { value: "matomo", label: "Matomo" },
];

export const PAYMENT_PROVIDER_OPTIONS = [
  { value: "none", label: "Chưa tích hợp" },
  { value: "sepay", label: "SePay (VietQR)" },
  { value: "momo", label: "MoMo" },
  { value: "vnpay", label: "VNPay" },
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
];

export const ROBOTS_POLICY_OPTIONS = [
  { value: "index,follow", label: "index, follow (mặc định)" },
  { value: "noindex,nofollow", label: "noindex, nofollow" },
  { value: "index,nofollow", label: "index, nofollow" },
  { value: "noindex,follow", label: "noindex, follow" },
];

export const SMTP_PORT_OPTIONS = [
  { value: "587", label: "587 (STARTTLS — phổ biến)" },
  { value: "465", label: "465 (SSL/TLS)" },
  { value: "25", label: "25 (SMTP không mã hóa)" },
  { value: "2525", label: "2525 (thay thế)" },
];

export const SESSION_TIMEOUT_OPTIONS = [
  { value: "15", label: "15 phút" },
  { value: "30", label: "30 phút" },
  { value: "45", label: "45 phút" },
  { value: "60", label: "1 giờ" },
  { value: "120", label: "2 giờ" },
  { value: "240", label: "4 giờ" },
  { value: "480", label: "8 giờ" },
];
