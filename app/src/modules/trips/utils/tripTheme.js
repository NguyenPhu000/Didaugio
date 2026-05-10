/**
 * tripTheme.js — shared design tokens for the Trips module.
 * Uses TAB_THEME colors for visual consistency across the app.
 */
import {
  TAB_SCREEN_PADDING,
  TAB_CARD_RADIUS,
} from "../../../../app/(tabs)/tabTheme";

export { TAB_SCREEN_PADDING, TAB_CARD_RADIUS };

export const TRIP_THEME = {
  background: "#F5F5F7",
  surface: "#FFFFFF",
  surfaceElevated: "#FAFAFC",
  surfaceMuted: "#EDEDF2",
  border: "#D2D2D7",
  borderSoft: "rgba(0,0,0,0.08)",
  primary: "#1D1D1F",
  primaryPressed: "#000000",
  primaryTint: "rgba(0,0,0,0.08)",
  text: "#1D1D1F",
  textSecondary: "rgba(0,0,0,0.8)",
  textMuted: "rgba(0,0,0,0.48)",
  success: "#34C759",
  warning: "#FF9F0A",
  danger: "#FF3B30",
  white: "#FFFFFF",
  black: "#000000",
};

export const TRIP_STATUS_META = {
  draft: {
    label: "Nháp",
    bg: "#FFF4D6",
    color: "#B45309",
    accent: "#F59E0B",
    icon: "edit-calendar",
  },
  active: {
    label: "Đang diễn ra",
    bg: "#DBEAFE",
    color: "#1D4ED8",
    accent: "#2563EB",
    icon: "flight-takeoff",
  },
  completed: {
    label: "Đã hoàn thành",
    bg: "#DCFCE7",
    color: "#047857",
    accent: "#10B981",
    icon: "task-alt",
  },
  cancelled: {
    label: "Đã hủy",
    bg: "#FEE2E2",
    color: "#B91C1C",
    accent: "#EF4444",
    icon: "event-busy",
  },
};

export const BOOKING_STATUS_META = {
  pending: {
    label: "Chờ xác nhận",
    color: "#1D1D1F",
    bg: "#EDEDF2",
  },
  confirmed: {
    label: "Đã xác nhận",
    color: "#FFFFFF",
    bg: "#1D1D1F",
  },
  completed: {
    label: "Hoàn thành",
    color: "#1D1D1F",
    bg: "#DFDFE4",
  },
  cancelled: {
    label: "Đã hủy",
    color: "#5A5A5E",
    bg: "#ECECEF",
  },
  rejected: {
    label: "Bị từ chối",
    color: "#8A4B12",
    bg: "#F2E8DF",
  },
  expired: {
    label: "Hết hạn",
    color: "#5A5A5E",
    bg: "#ECECEF",
  },
  no_show: {
    label: "Không đến",
    color: "#5A5A5E",
    bg: "#ECECEF",
  },
};

export function getBookingStatusMeta(status) {
  const normalized = String(status || "").toLowerCase();
  return (
    BOOKING_STATUS_META[normalized] || {
      label: normalized || "Không rõ",
      color: TRIP_THEME.text,
      bg: TRIP_THEME.surfaceMuted,
    }
  );
}
