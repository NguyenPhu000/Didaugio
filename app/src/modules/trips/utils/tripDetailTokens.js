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
export { TOKENS } from "../../../constants/design-tokens";

/* ── Color tokens ── */
export const T = {
  ink: BOOKING_APPLE_THEME.text,
  inkPressed: BOOKING_APPLE_THEME.primaryPressed,
  canvas: BOOKING_APPLE_THEME.surface,
  parchment: BOOKING_APPLE_THEME.background,
  surfacePearl: BOOKING_APPLE_THEME.surfaceElevated,
  /* Nền field / control phụ (input, chip nền) */
  field: BOOKING_APPLE_THEME.background,
  hairline: BOOKING_APPLE_THEME.borderSoft,
  border: BOOKING_APPLE_THEME.border,
  primary: BOOKING_APPLE_THEME.primary,
  onPrimary: BOOKING_APPLE_THEME.white,
  muted48: BOOKING_APPLE_THEME.textMuted,
  /* Trạng thái ngữ nghĩa */
  success: BOOKING_APPLE_THEME.success,
  warning: BOOKING_APPLE_THEME.warning,
  danger: BOOKING_APPLE_THEME.danger,
  timelineDot: BOOKING_APPLE_THEME.primary,
  timelineLine: "rgba(0,0,0,0.06)",
  timelineDistance: BOOKING_APPLE_THEME.textMuted,
  neonGlow: "rgba(0,0,0,0.03)",
};

/* Mức làm mờ icon/đường nét trên nền sáng — tránh hard-code rgba rải rác */
export const ALPHA = {
  iconFaint: "rgba(0,0,0,0.15)",
  iconMuted: "rgba(0,0,0,0.30)",
  iconStrong: "rgba(0,0,0,0.40)",
  placeholder: "rgba(0,0,0,0.30)",
};

export {
  BOOKING_STATUS_META,
  shouldShowBookingBadge,
  getBookingStatusMeta,
} from "./tripTheme";

/* ── Shared Tailwind Classes ── */
export const STYLES = {
  screen: "flex-1 bg-[#F5F5F7]",
  centered: "items-center justify-center gap-4 px-10",

  /* ── Header ── */
  header:
    "flex-row items-center px-5 py-3.5 gap-3.5 bg-white border-b border-black/[0.06]",
  backBtn:
    "w-[38px] h-[38px] rounded-full items-center justify-center bg-black/[0.04]",
  backBtnText: "text-[22px] text-ink -mt-0.5",
  headerCenter: "flex-1 gap-0.5",
  headerTitle: "text-[17px] font-semibold text-ink tracking-tight",
  headerMeta: "text-[12px] font-normal text-black/50 tracking-tight",
  headerActions: "flex-row items-center gap-1.5",
  headerActionBtn: "px-3 py-2 rounded-full",
  headerActionText: "text-[14px] font-normal text-ink tracking-tight",
  headerActionDanger: "text-[14px] font-normal text-danger tracking-tight",
  primaryBtn: "bg-ink px-4.5 py-2.25 rounded-full",
  primaryBtnText: "text-white text-[14px] font-semibold tracking-tight",

  /* ── Tab bar — pill style ── */
  tabBar: "flex-row px-5 py-2.5 bg-white gap-1.5",
  tabItem: "flex-1 items-center py-2.5 rounded-xl",
  tabItemActive: "bg-black/[0.05]",
  tabLabel: "text-[14px] font-medium text-black/50 tracking-tight",
  tabLabelActive: "text-ink font-semibold",
  tabIndicator:
    "absolute bottom-0 left-5 right-5 h-[2px] bg-ink rounded-[1px]",

  /* ── Day chips ── */
  dayChipsRow: "px-5 py-3 gap-2",
  dayChip: "px-4.5 py-2.5 rounded-[14px] bg-black/[0.04]",
  dayChipActive: "bg-ink",
  dayChipLabel: "text-[13px] font-semibold text-ink tracking-tight",
  dayChipLabelActive: "text-black",

  /* ── Inline loading ── */
  inlineLoading: "flex-row items-center gap-2 px-5 py-2",
  inlineLoadingText: "text-[13px] font-normal text-black/50",

  /* ── Empty states ── */
  emptyState: "flex-1 items-center justify-center px-10 py-16 gap-2",
  emptyTitle:
    "text-[18px] font-semibold text-ink tracking-tight text-center",
  emptyBody:
    "text-[14px] leading-5 font-normal text-black/50 text-center tracking-tight",
  centeredState: "flex-1 items-center justify-center px-10 gap-2",
  centeredBody: "text-[13px] font-normal text-black/50",
  linkBtn: "px-5 py-2.5",
  linkBtnText:
    "text-ink text-[17px] font-normal tracking-tight underline",

  /* ── Tab content wrapper ── */
  tabContent: "flex-1",

  /* ── Destination list ── */
  destList: "px-5 pb-[120px] gap-3",
  destCard: "bg-white rounded-[20px] p-4 gap-3 border border-black/[0.05]",
  destRow: "flex-row items-center gap-3",
  destThumb: "w-12 h-12 rounded-xl overflow-hidden bg-[#F5F5F7]",
  destThumbEmpty: "flex-1 bg-[#F5F5F7]",
  destInfo: "flex-1 gap-0.5",
  destName: "text-[15px] font-semibold text-ink tracking-tight",
  destAddress: "text-[12px] font-normal text-black/50 tracking-tight",
  destNote: "text-[12px] font-normal text-black/50 tracking-tight",
  destRemove: "px-2 py-1",
  destRemoveText: "text-[13px] font-normal text-danger tracking-tight",
  destDistance: "text-[12px] font-normal text-black/60 tracking-tight",

  /* ── Booking rows ── */
  destBookings: "border-t border-black/[0.06] pt-3 gap-2",
  bookingRow:
    "flex-row items-center justify-between gap-2.5 py-3 px-3.5 bg-black/[0.025] rounded-2xl border border-black/[0.04]",
  pressed: "opacity-70",
  bookingRowInfo: "flex-1 gap-0.75",
  bookingRowName: "text-[14px] font-semibold text-ink tracking-tight",
  bookingRowPlace: "text-[12px] font-normal text-black/50 tracking-tight",
  bookingRowMeta: "text-[12px] font-normal text-black/50 tracking-tight",
  bookingRowRight: "items-end gap-1.5",
  bookingRowPrice: "text-[14px] font-semibold text-ink tracking-tight",
  moreText: "text-[12px] font-normal text-black/50",

  /* ── Status badge ── */
  badge: "flex-row items-center gap-1.25 px-2.5 py-1 rounded-full",
  badgeDot: "w-1.25 h-1.25 rounded-full",
  badgeText: "text-[11px] font-semibold tracking-tight",

  /* ── Services ── */
  servicesList: "px-5 pt-4 pb-[120px] gap-5",
  group: "gap-2.5",
  groupLabel:
    "text-[12px] font-semibold text-black/50 tracking-widest uppercase",

  /* ── Timeline connector ── */
  timelineConnector: "flex-row items-center pl-5 py-0.5 gap-2",
  timelineLine: "w-0.5 h-7 bg-black/[0.06] ml-1.75 rounded-[1px]",
  timelineDistanceText: "text-[12px] text-black/50 font-normal tracking-tight",

  /* ── Budget ── */
  budgetList: "px-5 pt-4 pb-[120px] gap-5",
  summaryGrid: "flex-row flex-wrap gap-2.5",
  summaryCard:
    "w-[48%] rounded-[20px] bg-white p-4.5 gap-1.5 border border-black/[0.05]",
  summaryCardPrimary: "bg-ink border-ink",
  summaryLabel: "text-[12px] font-normal text-black/50 tracking-tight",
  summaryLabelLight: "text-[12px] font-normal text-white/55 tracking-tight",
  summaryValue: "text-[20px] font-semibold text-ink tracking-tight",
  summaryValueLight: "text-[30px] font-semibold text-white tracking-tighter",
  budgetDetail: "gap-2.5",

  /* ── Modal / form shared ── */
  sheet: "bg-white rounded-t-[24px] w-full flex-col flex-shrink",
  sheetHandle: "w-9 h-1 rounded-full bg-black/12 self-center mt-2.5 mb-1.5",
  sheetHeader:
    "flex-row items-center justify-between px-5 py-3 border-b border-black/[0.07]",
  sheetTitle: "text-[16px] font-semibold text-ink tracking-tight",
  sheetCloseBtn: "w-8 h-8 rounded-full items-center justify-center",
  sheetFooter:
    "px-5 pt-4 pb-2 border-t border-black/[0.07] bg-white flex-shrink-0",
  fieldLabel:
    "text-[11px] text-black/40 font-semibold uppercase tracking-widest",
  sectionLabel:
    "text-[11px] text-ink font-semibold uppercase tracking-widest mb-1.5",
  field:
    "bg-[#F5F5F7] rounded-xl px-3 py-3 text-[15px] text-ink font-normal border border-black/[0.06]",
  submitBtn:
    "w-full h-[52px] rounded-full bg-ink items-center justify-center",
  submitBtnText:
    "text-white text-[16px] font-semibold tracking-tight text-center",
  chip: "flex-row items-center gap-1.5 bg-[#F5F5F7] rounded-xl px-3 py-2.5 border border-black/[0.06]",
  chipActive: "bg-[#E8E8ED] border-[#1D1D1F]",
};

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
  headerActionText: {
    fontSize: 14,
    fontFamily: TOKENS.font.body,
    color: T.ink,
    letterSpacing: -0.224,
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
