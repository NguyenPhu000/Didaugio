/**
 * tripTheme.js — shared design tokens for the Trips module.
 * Uses TAB_THEME colors for visual consistency across the app.
 */
import i18n from "@/i18n";
import {
  TAB_SCREEN_PADDING,
  TAB_CARD_RADIUS,
} from "../../../../app/(tabs)/tabTheme";
import {
  BOOKING_APPLE_THEME,
  TOKENS as DESIGN_TOKENS,
} from "../../../constants/design-tokens";

export { TAB_SCREEN_PADDING, TAB_CARD_RADIUS };

export const TRIP_THEME = BOOKING_APPLE_THEME;

const STATUS_COLORS = DESIGN_TOKENS.color.semantic.status;
const BOOKING_COLORS = DESIGN_TOKENS.color.semantic.booking;

export const TRIP_STATUS_META = {
  upcoming: {
    key: "upcoming",
    label: "Sắp tới",
    bg: STATUS_COLORS.upcoming.background,
    color: STATUS_COLORS.upcoming.accent,
    text: STATUS_COLORS.upcoming.accent,
    accent: STATUS_COLORS.upcoming.accent,
    icon: "schedule",
  },
  active: {
    key: "ongoing",
    label: "Đang trong hành trình",
    bg: STATUS_COLORS.active.background,
    color: STATUS_COLORS.active.accent,
    text: STATUS_COLORS.active.accent,
    accent: STATUS_COLORS.active.accent,
    icon: "flight-takeoff",
  },
  ongoing: {
    key: "ongoing",
    label: "Đang trong hành trình",
    bg: STATUS_COLORS.active.background,
    color: STATUS_COLORS.active.accent,
    text: STATUS_COLORS.active.accent,
    accent: STATUS_COLORS.active.accent,
    icon: "flight-takeoff",
  },
  completed: {
    key: "completed",
    label: "Đã kết thúc",
    bg: STATUS_COLORS.completed.background,
    color: STATUS_COLORS.completed.accent,
    text: STATUS_COLORS.completed.accent,
    accent: STATUS_COLORS.completed.accent,
    icon: "task-alt",
  },
  cancelled: {
    key: "cancelled",
    label: "Đã hủy",
    bg: STATUS_COLORS.cancelled.background,
    color: STATUS_COLORS.cancelled.accent,
    text: STATUS_COLORS.cancelled.accent,
    accent: STATUS_COLORS.cancelled.accent,
    icon: "event-busy",
  },
};

export const BOOKING_STATUS_META = {
  pending: { label: i18n.t("tripTheme.bookingPending"), ...BOOKING_COLORS.pending },
  confirmed: { label: i18n.t("tripTheme.bookingConfirmed"), ...BOOKING_COLORS.confirmed },
  completed: { label: i18n.t("tripTheme.bookingCompleted"), ...BOOKING_COLORS.completed },
  cancelled: { label: i18n.t("tripTheme.bookingCancelled"), ...BOOKING_COLORS.cancelled },
  rejected: { label: i18n.t("tripTheme.bookingRejected"), ...BOOKING_COLORS.rejected },
  expired: { label: i18n.t("tripTheme.bookingClosed"), ...BOOKING_COLORS.neutral },
  no_show: { label: i18n.t("tripTheme.bookingNoShow"), ...BOOKING_COLORS.neutral },
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
      color: DESIGN_TOKENS.color.semantic.apple.ink,
      bg: DESIGN_TOKENS.color.semantic.apple.surface,
    }
  );
}
