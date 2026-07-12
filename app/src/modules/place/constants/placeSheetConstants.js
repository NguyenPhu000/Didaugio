/**
 * Design constants for the place detail bottom sheets.
 * Keeps PALETTE, TOKENS and shared helpers co-located so that
 * AllReviewsSheet, ReviewComposerSheet, and the place screen
 * all import from a single source of truth.
 */

import { REVIEW_MEDIA_LIMIT } from "../utils/reviewMedia";

const ACTIVE_FONT_FAMILY = "Afacad";

const FONT_FAMILIES = {
  BeVietnamPro: {
    heading: "BeVietnamPro_700Bold",
    body: "BeVietnamPro_400Regular",
    medium: "BeVietnamPro_500Medium",
    semibold: "BeVietnamPro_600SemiBold",
  },
  Afacad: {
    heading: "Afacad-Bold",
    body: "Afacad-Regular",
    medium: "Afacad-Medium",
    semibold: "Afacad-SemiBold",
  },
};

const ACTIVE_FONTS = FONT_FAMILIES[ACTIVE_FONT_FAMILY];

export const PALETTE = {
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceAlt: "#F5F5F7",
  heroFallback: "#E8EDF2",
  overlayStrong: "rgba(0,0,0,0.45)",
  text: "#1D1D1F",
  textMuted: "rgba(0,0,0,0.48)",
  textSoft: "rgba(0,0,0,0.32)",
  primary: "#1D1D1F",
  primaryDark: "#000000",
  primarySoft: "rgba(0,0,0,0.06)",
  border: "rgba(0,0,0,0.12)",
  borderSoft: "rgba(0,0,0,0.06)",
  success: "#34C759",
  warning: "#FF9F0A",
  accent: "#007BFF",
};

export const TOKENS = {
  font: {
    heading: ACTIVE_FONTS.heading,
    body: ACTIVE_FONTS.body,
    medium: ACTIVE_FONTS.medium,
    semibold: ACTIVE_FONTS.semibold,
  },
};

export const REVIEW_FILTER_RATINGS = [5, 4, 3, 2, 1];

export { REVIEW_MEDIA_LIMIT };

/**
 * Format a review count into a human-readable bilingual string.
 * @param {number} count
 * @param {(key: string, params?: object) => string} t – i18next translation helper
 * @returns {string}
 */
export function formatReviewCount(count, t) {
  const n = Number(count) || 0;
  if (n === 0) return t("place.detail.noReviewsShort");
  if (n === 1) return t("place.detail.oneReview");
  return t("place.detail.manyReviews", { count: n });
}
