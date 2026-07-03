/**
 * exploreHelpers.js — Pure helper functions for the Explore screen.
 * No React imports, no side effects. Easily testable.
 */
import i18n from "@/i18n";

export function normalizeText(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function getUserName(user) {
  const rawName =
    user?.profile?.fullName ||
    user?.fullName ||
    user?.name ||
    user?.displayName ||
    user?.username ||
    user?.profile?.nickname ||
    user?.nickname ||
    "";

  if (typeof rawName === "string" && rawName.trim()) {
    return rawName.trim();
  }

  const emailName = user?.email?.split("@")?.[0];
  return emailName || i18n.t("exploreHelpers.you");
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return i18n.t("exploreHelpers.goodMorning");
  if (hour < 18) return i18n.t("exploreHelpers.hello");
  return i18n.t("exploreHelpers.goodEvening");
}

export function getCategoryIcon(name = "") {
  const value = normalizeText(name);
  if (value.includes("bien") || value.includes("beach")) return "beach-access";
  if (
    value.includes("nui") ||
    value.includes("mount") ||
    value.includes("nature")
  ) {
    return "terrain";
  }
  if (value.includes("an") || value.includes("food")) return "restaurant";
  if (
    value.includes("van hoa") ||
    value.includes("bao tang") ||
    value.includes("museum")
  ) {
    return "museum";
  }
  if (value.includes("vui choi") || value.includes("giai tri")) {
    return "attractions";
  }
  if (value.includes("mua sam") || value.includes("shop")) return "storefront";
  if (value.includes("luu tru") || value.includes("khach san")) return "hotel";
  if (value.includes("cho") || value.includes("market")) return "store";
  if (value.includes("chua") || value.includes("dinh") || value.includes("pagoda")) return "temple-buddhist";
  return "explore";
}

export function formatCount(value) {
  if (!value) return i18n.t("exploreHelpers.new");
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

export function formatRatingLabel(place) {
  const n = Number(place?.ratingCount ?? place?.reviewCount ?? place?._count?.reviews ?? 0);
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k ${i18n.t("exploreHelpers.reviews")}`;
  if (n > 0) return `${n} ${i18n.t("exploreHelpers.reviews")}`;
  return i18n.t("exploreHelpers.new");
}

export function formatPriceLine(place) {
  const from = place?.priceFrom ?? place?.price_from;
  if (from != null) {
    const n = Number(from);
    if (n === 0) {
      return { main: i18n.t("exploreHelpers.free"), suffix: "" };
    }
    if (n > 0) {
      let main;
      if (n >= 1_000_000) {
        main = `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}tr`;
      } else if (n >= 1000) {
        main = `${Math.round(n / 1000)}k`;
      } else {
        main = `${n}đ`;
      }
      return { main, suffix: i18n.t("exploreHelpers.perTurn") };
    }
  }

  if (place?.priceRange) {
    const pr = String(place.priceRange).toUpperCase();
    if (pr === "FREE") return { main: i18n.t("exploreHelpers.free"), suffix: "" };
    if (pr === "BUDGET") return { main: i18n.t("exploreHelpers.cheap"), suffix: "" };
    if (pr === "MODERATE") return { main: i18n.t("exploreHelpers.budget"), suffix: "" };
    if (pr === "EXPENSIVE") return { main: i18n.t("exploreHelpers.premium"), suffix: "" };
    return { main: pr, suffix: "" };
  }
  return null;
}

export function getPlaceLocation(place) {
  const location = [place?.district?.name, place?.ward?.name, place?.address]
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");

  if (!location) return i18n.t("exploreHelpers.canTho");
  return location;
}

export function getWeatherLabel() {
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "numeric",
  }).format(new Date()).toUpperCase();
}
