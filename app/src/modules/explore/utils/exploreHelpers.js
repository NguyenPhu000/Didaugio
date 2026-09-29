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

  return location || null;
}

export function getWeatherLabel() {
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "numeric",
  }).format(new Date()).toUpperCase();
}

/**
 * Tính khoảng cách đường chim bay theo công thức Haversine (km)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((value) => value == null || String(value).trim() === "")) return null;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  if (!Number.isFinite(numLat1) || !Number.isFinite(numLon1) || !Number.isFinite(numLat2) || !Number.isFinite(numLon2)) {
    return null;
  }
  if (Math.abs(numLat1) > 90 || Math.abs(numLat2) > 90 || Math.abs(numLon1) > 180 || Math.abs(numLon2) > 180) return null;
  const R = 6371; // Bán kính trái đất (km)
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

/**
 * Trả về nhãn khoảng cách thật từ GPS hoặc quận huyện thực tế
 */
export function getPlaceDistanceLabel(place, userCoords) {
  if (place?.distance != null) {
    const dist = Number(place.distance);
    if (!Number.isFinite(dist) || dist < 0) return null;
    if (dist < 1) return `${Math.round(dist * 1000)} m`;
    return `${dist.toFixed(1)} km`;
  }

  if (userCoords?.latitude != null && userCoords?.longitude != null && place?.latitude != null && place?.longitude != null) {
    const dist = calculateDistanceKm(userCoords.latitude, userCoords.longitude, place.latitude, place.longitude);
    if (dist != null) {
      if (dist < 1) return `${Math.round(dist * 1000)} m`;
      return `${dist.toFixed(1)} km`;
    }
  }

  return null;
}

/**
 * Lấy danh sách tiện ích / tags THỰC TẾ từ database (không mock data)
 */
export function getPlaceAmenitiesList(place) {
  const items = [];

  if (Array.isArray(place?.amenities) && place.amenities.length > 0) {
    for (const a of place.amenities) {
      const label = a?.amenityValue || a?.amenityType;
      if (label && !items.some((i) => i.label === label)) {
        items.push({
          icon: a?.icon || "sparkles",
          label: String(label).trim(),
        });
      }
      if (items.length >= 2) break;
    }
  }

  if (items.length < 2 && Array.isArray(place?.tagLinks) && place.tagLinks.length > 0) {
    for (const tl of place.tagLinks) {
      const tag = tl?.tag;
      if (tag?.name && !items.some((i) => i.label === tag.name)) {
        items.push({
          icon: tag?.icon || "tag",
          label: tag.name.trim(),
        });
      }
      if (items.length >= 2) break;
    }
  }

  return items;
}

/**
 * Lấy trạng thái và giờ mở cửa THỰC TẾ hôm nay (không mock giờ nếu DB chưa có)
 */
export function getPlaceOpeningHoursInfo(place, now = new Date()) {
  // Places are in Vietnam; the device may be configured for another timezone.
  const today = new Date(now.getTime() + 7 * 60 * 60 * 1000).getUTCDay();
  const hours = Array.isArray(place?.openingHours)
    ? place.openingHours.find((item) => Number(item?.dayOfWeek) === today)
    : null;
  if (!hours) return null;
  const vi = i18n.language?.startsWith("vi");
  if (hours.isClosed) {
    return { isOpen: false, statusText: vi ? "Đóng cửa" : "Closed", hoursText: vi ? "Hôm nay" : "Today", color: "#64748B" };
  }
  const validTime = (value) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  if (!validTime(hours.openTime) || !validTime(hours.closeTime)) return null;
  const pause = validTime(hours.breakStart) && validTime(hours.breakEnd)
    ? ` · ${vi ? "Nghỉ" : "Break"} ${hours.breakStart}–${hours.breakEnd}`
    : "";
  // Display the recorded schedule, without claiming the venue is open right now.
  return {
    isOpen: null,
    statusText: vi ? "Giờ hôm nay" : "Today",
    hoursText: `${hours.openTime}–${hours.closeTime}${pause}`,
    color: "#64748B",
  };
}

/**
 * Định dạng hiển thị giá THỰC TẾ từ database (không fake mức giá)
 */
export function formatPlacePriceDisplay(place) {
  const number = (value) => {
    if (value == null || String(value).trim() === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  };
  const from = number(place?.priceFrom ?? place?.price_from);
  const to = number(place?.priceTo);
  const vi = i18n.language?.startsWith("vi");
  const money = (value) => `${new Intl.NumberFormat(vi ? "vi-VN" : "en-US").format(value)}đ`;
  const result = (prefix, amount, isFree = false) => ({ prefix, amount, display: [prefix, amount].filter(Boolean).join(" "), isFree });
  if (from != null) {
    if (to != null && to > from) return result("", `${money(from)}–${money(to)}`);
    if (from === 0) return result("", i18n.t("exploreHelpers.free"), true);
    return result(to === from ? "" : vi ? "Từ" : "From", money(from));
  }
  if (to != null && to > 0) return result(vi ? "Đến" : "Up to", money(to));
  const range = String(place?.priceRange || "").toUpperCase();
  const keys = { FREE: "free", BUDGET: "cheap", MODERATE: "budget", EXPENSIVE: "premium", LUXURY: "premium" };
  return keys[range] ? result("", i18n.t(`exploreHelpers.${keys[range]}`), range === "FREE") : null;
}
