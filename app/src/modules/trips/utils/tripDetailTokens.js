/**
 * tripDetailTokens.js — Apple DESIGN.md tokens & shared styles for Trip Detail screen.
 *
 * Principles:
 * - Minimal, no heavy shadows — elevation via surface-color contrast
 * - Monochrome accent: Ink Black (#1D1D1F)
 * - Clean hairline borders for structural separation
 * - Premium rounded corners and generous spacing
 */
import { StyleSheet } from "react-native";
import { TOKENS, BOOKING_APPLE_THEME } from "../../../constants/design-tokens";

/* ── Color tokens ── */
export const T = {
  ink: BOOKING_APPLE_THEME.text,
  canvas: BOOKING_APPLE_THEME.surface,
  parchment: BOOKING_APPLE_THEME.background,
  surfacePearl: BOOKING_APPLE_THEME.surfaceElevated,
  hairline: BOOKING_APPLE_THEME.borderSoft,
  border: BOOKING_APPLE_THEME.border,
  primary: BOOKING_APPLE_THEME.primary,
  onPrimary: BOOKING_APPLE_THEME.white,
  muted48: BOOKING_APPLE_THEME.textMuted,
  danger: BOOKING_APPLE_THEME.danger,
  timelineDot: BOOKING_APPLE_THEME.primary,
  timelineLine: "rgba(0,0,0,0.06)",
  timelineDistance: BOOKING_APPLE_THEME.textMuted,
  neonGlow: "rgba(0,0,0,0.03)",
};

/* ── Booking status visual map ── */
export const BOOKING_STATUS_META = {
  pending: { label: "Chờ xác nhận", color: T.ink, bg: "#F5F5F7" },
  confirmed: { label: "Đã xác nhận", color: T.onPrimary, bg: T.ink },
  completed: { label: "Hoàn thành", color: T.ink, bg: "#EFEFEF" },
  cancelled: { label: "Đã hủy", color: T.muted48, bg: "#F5F5F7" },
  rejected: { label: "Bị từ chối", color: "#8A4B12", bg: "#FFF5EB" },
  expired: { label: "Hết hạn", color: T.muted48, bg: "#F5F5F7" },
  no_show: { label: "Không đến", color: T.muted48, bg: "#F5F5F7" },
};

export function getBookingStatusMeta(status) {
  const normalized = String(status || "").toLowerCase();
  return (
    BOOKING_STATUS_META[normalized] || {
      label: normalized || "Không rõ",
      color: T.ink,
      bg: "#F5F5F7",
    }
  );
}

/* ── Shared StyleSheet ── */
const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: T.parchment,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 40,
  },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    backgroundColor: T.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  backBtnText: {
    fontSize: 22,
    color: T.ink,
    marginTop: -2,
  },
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
    letterSpacing: -0.374,
  },
  headerMeta: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
    letterSpacing: -0.12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  headerActionDanger: {
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    color: T.danger,
    letterSpacing: -0.224,
  },
  primaryBtn: {
    backgroundColor: T.primary,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 9999,
  },
  primaryBtnText: {
    color: T.onPrimary,
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.224,
  },

  /* ── Tab bar — pill style ── */
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: T.canvas,
    gap: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabItemActive: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: TOKENS.font.medium,
    color: T.muted48,
    letterSpacing: -0.224,
  },
  tabLabelActive: {
    color: T.ink,
    fontFamily: TOKENS.font.semibold,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: T.ink,
    borderRadius: 1,
  },

  /* ── Day chips ── */
  dayChipsRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  dayChipActive: {
    backgroundColor: T.ink,
  },
  dayChipLabel: {
    fontSize: 13,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
    letterSpacing: -0.224,
  },
  dayChipLabelActive: {
    color: T.onPrimary,
  },

  /* ── Inline loading ── */
  inlineLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  inlineLoadingText: {
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
  },

  /* ── Empty states ── */
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 64,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
    letterSpacing: -0.374,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
    textAlign: "center",
    letterSpacing: -0.224,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 8,
  },
  centeredBody: {
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
  },
  linkBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  linkBtnText: {
    color: T.primary,
    fontSize: 17,
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.374,
  },

  /* ── Tab content wrapper ── */
  tabContent: {
    flex: 1,
  },

  /* ── Destination list ── */
  destList: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 12,
  },
  destCard: {
    backgroundColor: T.canvas,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  destRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  destThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F5F5F7",
  },
  destThumbEmpty: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
  destInfo: {
    flex: 1,
    gap: 2,
  },
  destName: {
    fontSize: 15,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
    letterSpacing: -0.374,
  },
  destAddress: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
    letterSpacing: -0.12,
  },
  destNote: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
    letterSpacing: -0.12,
  },
  destRemove: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  destRemoveText: {
    fontSize: 13,
    fontFamily: TOKENS.font.body,
    color: T.danger,
    letterSpacing: -0.224,
  },
  destDistance: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: T.primary,
    letterSpacing: -0.12,
  },

  /* ── Booking rows ── */
  destBookings: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.06)",
    paddingTop: 12,
    gap: 8,
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(0,0,0,0.025)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  pressed: {
    opacity: 0.7,
  },
  bookingRowInfo: {
    flex: 1,
    gap: 3,
  },
  bookingRowName: {
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
    letterSpacing: -0.224,
  },
  bookingRowPlace: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
    letterSpacing: -0.12,
  },
  bookingRowMeta: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
    letterSpacing: -0.12,
  },
  bookingRowRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  bookingRowPrice: {
    fontSize: 14,
    fontFamily: TOKENS.font.semibold,
    color: T.ink,
    letterSpacing: -0.224,
  },
  moreText: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
  },

  /* ── Status badge ── */
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: TOKENS.font.semibold,
    letterSpacing: -0.08,
  },

  /* ── Services ── */
  servicesList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 20,
  },
  group: {
    gap: 10,
  },
  groupLabel: {
    fontSize: 12,
    fontFamily: TOKENS.font.semibold,
    color: T.muted48,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  /* ── Timeline connector ── */
  timelineConnector: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingVertical: 2,
    gap: 8,
  },
  timelineLine: {
    width: 2,
    height: 28,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginLeft: 7,
    borderRadius: 1,
  },
  timelineDistanceText: {
    fontSize: 12,
    color: T.muted48,
    fontFamily: TOKENS.font.body,
    letterSpacing: -0.12,
  },

  /* ── Budget ── */
  budgetList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 20,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  summaryCard: {
    width: "48%",
    borderRadius: 20,
    backgroundColor: T.canvas,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  summaryCardPrimary: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: T.muted48,
    letterSpacing: -0.12,
  },
  summaryLabelLight: {
    fontSize: 12,
    fontFamily: TOKENS.font.body,
    color: "rgba(255,255,255,0.55)",
    letterSpacing: -0.12,
  },
  summaryValue: {
    fontSize: 20,
    fontFamily: TOKENS.font.heading,
    color: T.ink,
    letterSpacing: -0.374,
  },
  summaryValueLight: {
    fontSize: 30,
    fontFamily: TOKENS.font.heading,
    color: T.onPrimary,
    letterSpacing: -0.5,
  },
  budgetDetail: {
    gap: 10,
  },
});

export default s;
