/** Khớp server/utils/bookingTimeSlot.js */
export const TIME_SLOT_KEYS = {
  MORNING: "morning",
  NOON: "noon",
  AFTERNOON: "afternoon",
  EVENING: "evening",
};

export const TIME_SLOT_LABELS = {
  [TIME_SLOT_KEYS.MORNING]: "Sáng (6h–12h)",
  [TIME_SLOT_KEYS.NOON]: "Trưa (12h–14h)",
  [TIME_SLOT_KEYS.AFTERNOON]: "Chiều (14h–18h)",
  [TIME_SLOT_KEYS.EVENING]: "Tối (sau 18h)",
};

/** Giờ mặc định khi kéo sang khung (VN +07:00) */
export const SLOT_DEFAULT_HOUR_VN = {
  [TIME_SLOT_KEYS.MORNING]: 9,
  [TIME_SLOT_KEYS.NOON]: 12,
  [TIME_SLOT_KEYS.AFTERNOON]: 15,
  [TIME_SLOT_KEYS.EVENING]: 19,
};

export function buildBookingTimeIsoFromDateAndSlot(dateYmd, slotKey) {
  const h = SLOT_DEFAULT_HOUR_VN[slotKey] ?? 9;
  const hh = String(h).padStart(2, "0");
  return new Date(`${dateYmd}T${hh}:00:00+07:00`).toISOString();
}
