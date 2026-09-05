import { BOOKING_STATUS } from "@/constants/constants";

export const BOOKING_MODELS = {
  CAPACITY: "capacity",
  RESOURCE: "resource",
  SLOT: "slot",
};

export const TIME_SLOTS = [
  { id: "06:00", label: "06:00", period: "morning" },
  { id: "07:00", label: "07:00", period: "morning" },
  { id: "08:00", label: "08:00", period: "morning" },
  { id: "09:00", label: "09:00", period: "morning" },
  { id: "10:00", label: "10:00", period: "morning" },
  { id: "11:00", label: "11:00", period: "morning" },
  { id: "12:00", label: "12:00", period: "afternoon" },
  { id: "13:00", label: "13:00", period: "afternoon" },
  { id: "14:00", label: "14:00", period: "afternoon" },
  { id: "15:00", label: "15:00", period: "afternoon" },
  { id: "16:00", label: "16:00", period: "afternoon" },
  { id: "17:00", label: "17:00", period: "afternoon" },
  { id: "18:00", label: "18:00", period: "evening" },
  { id: "19:00", label: "19:00", period: "evening" },
  { id: "20:00", label: "20:00", period: "evening" },
  { id: "21:00", label: "21:00", period: "evening" },
];

export const STATUS_CONFIGS = {
  [BOOKING_STATUS.PENDING]: {
    bg: "bg-[#FFF9F2] dark:bg-amber-950/20 border-[#FCD4AF]",
    text: "text-amber-800 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  [BOOKING_STATUS.CONFIRMED]: {
    bg: "bg-[#F2F7FF] dark:bg-blue-950/20 border-[#BED6FF]",
    text: "text-blue-800 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  [BOOKING_STATUS.COMPLETED]: {
    bg: "bg-[#F0FDF4] dark:bg-emerald-950/20 border-[#BBF7D0]",
    text: "text-emerald-800 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  [BOOKING_STATUS.CANCELLED]: {
    bg: "bg-slate-100 dark:bg-muted border-slate-200",
    text: "text-slate-500",
    dot: "bg-slate-400",
  },
  [BOOKING_STATUS.REJECTED]: {
    bg: "bg-rose-50 dark:bg-rose-950/20 border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
  [BOOKING_STATUS.EXPIRED]: {
    bg: "bg-orange-50 dark:bg-orange-950/20 border-orange-200",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
  [BOOKING_STATUS.NO_SHOW]: {
    bg: "bg-purple-50 dark:bg-purple-950/20 border-purple-200",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
};

export const isSameDay = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const toDateString = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const getWeekDays = (startDate) => {
  const days = [];
  const start = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    days.push(date);
  }
  return days;
};
