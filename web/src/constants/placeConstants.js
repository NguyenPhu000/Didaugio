/**
 * PLACE CONSTANTS
 * Centralized constants for place management
 */

export const PRICE_RANGES = [
  {
    value: "FREE",
    label: "MIỄN PHÍ",
    icon: "FREE",
    description: "0 VNĐ",
    color: "text-blue-600",
  },
  {
    value: "BUDGET",
    label: "BÌNH DÂN",
    icon: "$",
    description: "< 100K",
    color: "text-green-600",
  },
  {
    value: "MODERATE",
    label: "TRUNG BÌNH",
    icon: "$$",
    description: "100K - 300K",
    color: "text-yellow-600",
  },
  {
    value: "EXPENSIVE",
    label: "CAO CẤP",
    icon: "$$$",
    description: "300K - 1M",
    color: "text-orange-600",
  },
  {
    value: "LUXURY",
    label: "SANG TRỌNG",
    icon: "$$$$",
    description: "> 1M",
    color: "text-purple-600",
  },
];

export const IMAGE_UPLOAD_CONFIG = {
  MAX_IMAGES: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_WIDTH: 1200,
  MAX_HEIGHT: 1200,
  JPEG_QUALITY: 0.7,
};

export const DAYS_OF_WEEK = [
  { value: "monday", label: "Thứ Hai" },
  { value: "tuesday", label: "Thứ Ba" },
  { value: "wednesday", label: "Thứ Tư" },
  { value: "thursday", label: "Thứ Năm" },
  { value: "friday", label: "Thứ Sáu" },
  { value: "saturday", label: "Thứ Bảy" },
  { value: "sunday", label: "Chủ Nhật" },
];
