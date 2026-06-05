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
  upcoming: {
    label: "Sắp tới",
    bg: "#BAE6FD",
    color: "#075985",
    text: "#075985",
    accent: "#0EA5E9",
    icon: "schedule",
  },
  active: {
    label: "Đang diễn ra",
    bg: "#BFDBFE",
    color: "#1E3A8A",
    text: "#1E3A8A",
    accent: "#2563EB",
    icon: "flight-takeoff",
  },
  ongoing: {
    label: "Đang diễn ra",
    bg: "#BFDBFE",
    color: "#1E3A8A",
    text: "#1E3A8A",
    accent: "#2563EB",
    icon: "flight-takeoff",
  },
  completed: {
    label: "Đã hoàn thành",
    bg: "#BBF7D0",
    color: "#14532D",
    text: "#14532D",
    accent: "#22C55E",
    icon: "task-alt",
  },
  cancelled: {
    label: "Đã hủy",
    bg: "#FECACA",
    color: "#991B1B",
    text: "#991B1B",
    accent: "#EF4444",
    icon: "event-busy",
  },
};

export const BOOKING_STATUS_META = {
  pending: { label: "Chờ xác nhận", color: "#D97706", bg: "#FFF9E6" },
  confirmed: { label: "Đã xác nhận", color: "#15803D", bg: "#DCFCE7" },
  completed: { label: "Hoàn thành", color: "#1D1D1F", bg: "#EFEFEF" },
  cancelled: { label: "Đã hủy", color: "rgba(0,0,0,0.48)", bg: "#F5F5F7" },
  rejected: { label: "Bị từ chối", color: "#8A4B12", bg: "#FFF5EB" },
  expired: { label: "Đã đóng phiếu", color: "rgba(0,0,0,0.48)", bg: "#F5F5F7" },
  no_show: { label: "Không đến", color: "rgba(0,0,0,0.48)", bg: "#F5F5F7" },
};

export function shouldShowBookingBadge(status, destState) {
  const normalized = String(status || "").toLowerCase();
  if (!normalized) return false;

  if (destState === "visited" || destState === "ongoing") {
    if (normalized === "expired" || normalized === "no_show") {
      return false;
    }
  }

  return true;
}

export function getBookingStatusMeta(status) {
  const normalized = String(status || "").toLowerCase();
  return (
    BOOKING_STATUS_META[normalized] || {
      label: normalized || "Không rõ",
      color: "#1D1D1F",
      bg: "#F5F5F7",
    }
  );
}
