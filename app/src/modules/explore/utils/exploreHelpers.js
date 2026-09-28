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
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  if (!Number.isFinite(numLat1) || !Number.isFinite(numLon1) || !Number.isFinite(numLat2) || !Number.isFinite(numLon2)) {
    return null;
  }
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

  // Nếu không có tọa độ GPS, hiển thị tên quận huyện thật từ DB
  const districtName = place?.district?.name || place?.ward?.district?.name;
  if (districtName) return districtName;
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
export function getPlaceOpeningHoursInfo(place) {
  const today = new Date().getDay();
  const todayHours = Array.isArray(place?.openingHours)
    ? place.openingHours.find((h) => h?.dayOfWeek === today)
    : null;

  if (todayHours) {
    if (todayHours.isClosed) {
      return {
        isOpen: false,
        statusText: "Đóng cửa",
        hoursText: "Hôm nay",
        color: "#DC2626",
      };
    }
    if (todayHours.openTime && todayHours.closeTime) {
      return {
        isOpen: true,
        statusText: "Mở cửa",
        hoursText: `${todayHours.openTime} - ${todayHours.closeTime}`,
        color: "#16A34A",
      };
    }
  }

  return null;
}

/**
 * Định dạng hiển thị giá THỰC TẾ từ database (không fake mức giá)
 */
export function formatPlacePriceDisplay(place) {
  const priceFrom = place?.priceFrom ?? place?.price_from;
  if (priceFrom != null) {
    const num = Number(priceFrom);
    if (num === 0) {
      return {
        prefix: "",
        amount: "Miễn phí",
        display: "Miễn phí",
        isFree: true,
      };
    }
    if (num > 0) {
      const formatted = new Intl.NumberFormat("vi-VN").format(num);
      return {
        prefix: "Từ",
        amount: `${formatted}đ`,
        display: `Từ ${formatted}đ`,
        isFree: false,
      };
    }
  }

  if (place?.priceRange) {
    const pr = String(place.priceRange).toUpperCase();
    if (pr === "FREE") {
      return {
        prefix: "",
        amount: "Miễn phí",
        display: "Miễn phí",
        isFree: true,
      };
    }
    if (pr === "BUDGET") {
      return {
        prefix: "",
        amount: "Giá bình dân",
        display: "Giá bình dân",
        isFree: false,
      };
    }
    if (pr === "MODERATE") {
      return {
        prefix: "",
        amount: "Giá vừa phải",
        display: "Giá vừa phải",
        isFree: false,
      };
    }
    if (pr === "EXPENSIVE" || pr === "LUXURY") {
      return {
        prefix: "",
        amount: "Cao cấp",
        display: "Cao cấp",
        isFree: false,
      };
    }
  }

  return null;
}

