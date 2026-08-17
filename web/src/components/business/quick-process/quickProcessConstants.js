import { TIME_SLOT_KEYS } from "@/constants/bookingSchedule";

export const SLOT_OPTIONS = [
  { key: TIME_SLOT_KEYS.MORNING, label: "Buổi Sáng", desc: "05:00 - 11:59" },
  { key: TIME_SLOT_KEYS.NOON, label: "Buổi Trưa", desc: "11:00 - 13:59" },
  { key: TIME_SLOT_KEYS.AFTERNOON, label: "Buổi Chiều", desc: "12:00 - 17:59" },
  { key: TIME_SLOT_KEYS.EVENING, label: "Buổi Tối", desc: "18:00 - 23:59" },
];
