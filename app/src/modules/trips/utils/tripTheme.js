/**
 * tripTheme.js — shared design tokens for the Trips module.
 * Uses TAB_THEME colors for visual consistency across the app.
 */
import i18n from "@/i18n";
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
    key: "upcoming",
    label: "Sắp tới",
    bg: "rgba(56, 189, 248, 0.15)",
    color: "#38BDF8",
    text: "#38BDF8",
    accent: "#38BDF8",
    icon: "schedule",
  },
  active: {
    key: "ongoing",
    label: "Đang trong hành trình",
    bg: "rgba(52, 211, 153, 0.15)",
    color: "#34D399",
    text: "#34D399",
    accent: "#34D399",
    icon: "flight-takeoff",
  },
  ongoing: {
    key: "ongoing",
    label: "Đang trong hành trình",
    bg: "rgba(52, 211, 153, 0.15)",
    color: "#34D399",
    text: "#34D399",
    accent: "#34D399",
    icon: "flight-takeoff",
  },
  completed: {
    key: "completed",
    label: "Đã kết thúc",
    bg: "rgba(148, 163, 184, 0.15)",
    color: "#94A3B8",
    text: "#94A3B8",
    accent: "#94A3B8",
    icon: "task-alt",
  },
  cancelled: {
    key: "cancelled",
    label: "Đã hủy",
    bg: "rgba(248, 113, 113, 0.15)",
    color: "#F87171",
    text: "#F87171",
    accent: "#F87171",
    icon: "event-busy",
  },
};

export const BOOKING_STATUS_META = {
  pending: { label: i18n.t("tripTheme.bookingPending"), color: "#D97706", bg: "#FFF9E6" },
  confirmed: { label: i18n.t("tripTheme.bookingConfirmed"), color: "#15803D", bg: "#DCFCE7" },
  completed: { label: i18n.t("tripTheme.bookingCompleted"), color: "#1D1D1F", bg: "#EFEFEF" },
  cancelled: { label: i18n.t("tripTheme.bookingCancelled"), color: "rgba(0,0,0,0.48)", bg: "#F5F5F7" },
  rejected: { label: i18n.t("tripTheme.bookingRejected"), color: "#8A4B12", bg: "#FFF5EB" },
  expired: { label: i18n.t("tripTheme.bookingClosed"), color: "rgba(0,0,0,0.48)", bg: "#F5F5F7" },
  no_show: { label: i18n.t("tripTheme.bookingNoShow"), color: "rgba(0,0,0,0.48)", bg: "#F5F5F7" },
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
      label: normalized || i18n.t("tripTheme.unknown"),
      color: "#1D1D1F",
      bg: "#F5F5F7",
    }
  );
}
