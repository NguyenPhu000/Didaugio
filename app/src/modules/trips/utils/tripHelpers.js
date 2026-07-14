import i18n from "../../../i18n";
import { TRIP_STATUS_META } from "./tripTheme";

export function getTripFilters() {
  return [
    { key: "all", label: i18n.t("tripHelpers.all") },
    { key: "active", label: i18n.t("tripHelpers.upcoming") },
    { key: "done", label: i18n.t("tripHelpers.completed") },
  ];
}

export const FILTERS = getTripFilters();

export const STATUS_THEME = TRIP_STATUS_META;

function pad2(value) {
  return String(value).padStart(2, "0");
}

/**
 * Định dạng ngày tường minh dd/mm/yy (hoặc dd/mm/yyyy).
 */
export function formatDateDmy(dateInput, { twoDigitYear = true } = {}) {
  const date =
    dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;

  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = twoDigitYear
    ? pad2(date.getFullYear() % 100)
    : String(date.getFullYear());

  return `${day}/${month}/${year}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return null;
  return formatDateDmy(dateStr);
}

export function formatFriendlyDate(dateStr, includeYear = true) {
  if (!dateStr) return null;
  return formatDateDmy(dateStr, { twoDigitYear: includeYear });
}

export function getDateRangeLabel(trip) {
  if (trip.startDate && trip.endDate) {
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const startLabel = formatDateDmy(start);
      const endLabel = formatDateDmy(end);
      if (startLabel === endLabel) return startLabel;
      return `${startLabel} - ${endLabel}`;
    }
  }

  if (trip.startDate) {
    const start = new Date(trip.startDate);
    if (!Number.isNaN(start.getTime())) {
      return i18n.t("tripHelpers.from", { date: formatDateDmy(start) });
    }
  }

  return i18n.t("tripHelpers.noDate");
}

/**
 * Ngày tách dòng cho TripCard (tránh cắt chữ khi range dài).
 */
export function getTripCardDateDisplay(trip) {
  const startLabel = trip?.startDate ? formatDateDmy(trip.startDate) : null;
  const endLabel = trip?.endDate ? formatDateDmy(trip.endDate) : null;

  if (startLabel && endLabel) {
    if (startLabel === endLabel) {
      return { kind: "single", label: startLabel };
    }
    return { kind: "range", start: startLabel, end: endLabel };
  }

  if (startLabel) {
    return { kind: "from", label: startLabel };
  }

  if (endLabel) {
    return { kind: "to", label: endLabel };
  }

  return { kind: "empty" };
}

export function getDaysUntil(dateStr) {
  if (!dateStr) return null;

  const now = new Date();
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );

  return Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24),
  );
}

/**
 * Trạng thái hiển thị thực tế của chuyến đi (state machine).
 *
 * Ưu tiên trạng thái nguồn (status từ DB) trước khi suy luận theo ngày để
 * tránh xung đột "Nháp" vs "Đang trong hành trình".
 *
 * Trả về một trong: "draft" | "upcoming" | "ongoing" | "completed" | "cancelled".
 */
export function getSafeDateTime(dateStr, fallback = Number.MAX_SAFE_INTEGER) {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  const t = d.getTime();
  return Number.isNaN(t) ? fallback : t;
}

export function getDisplayStatus(trip) {
  if (!trip) return "upcoming";

  const rawStatus = String(trip.status || "").toLowerCase();
  if (rawStatus === "completed") return "completed";
  if (rawStatus === "cancelled") return "cancelled";
  if (rawStatus === "in-progress" || rawStatus === "ongoing" || rawStatus === "active") {
    return "ongoing";
  }

  // Map draft to upcoming status
  if (rawStatus === "draft") return "upcoming";

  const daysUntil = getDaysUntil(trip.startDate);
  if (daysUntil === null) {
    return "upcoming";
  }
  if (daysUntil < 0) {
    const endDaysUntil = getDaysUntil(trip.endDate);
    if (endDaysUntil !== null && endDaysUntil < 0) return "completed";
    return "ongoing";
  }
  return "upcoming";
}

/**
 * Chuyến đi có thể "Bắt đầu hành trình" hôm nay hay không.
 * Điều kiện: hôm nay nằm trong khoảng startDate..endDate (hoặc bắt đầu hôm nay)
 * và chuyến đi chưa hoàn thành / hủy.
 */
export function canStartTrip(trip) {
  if (!trip) return false;
  const rawStatus = String(trip.status || "").toLowerCase();
  if (rawStatus === "completed" || rawStatus === "cancelled") return false;

  const startDaysUntil = getDaysUntil(trip.startDate);
  // Không xác định được ngày bắt đầu → cho phép bắt đầu thủ công.
  if (startDaysUntil === null) return true;
  if (startDaysUntil > 0) return false;

  const endDaysUntil = getDaysUntil(trip.endDate);
  if (endDaysUntil !== null && endDaysUntil < 0) return false;
  return true;
}

export function getTimelineLabel(trip) {
  const displayStatus = getDisplayStatus(trip);
  if (displayStatus === "completed") return i18n.t("tripHelpers.ended");
  if (displayStatus === "cancelled") return i18n.t("tripHelpers.noLongerValid");

  const daysUntil = getDaysUntil(trip.startDate);
  if (displayStatus === "ongoing") return i18n.t("tripHelpers.inJourney");
  if (daysUntil === 0) return i18n.t("tripHelpers.startToday");
  if (daysUntil === 1) return i18n.t("tripHelpers.startTomorrow");
  if (daysUntil !== null && daysUntil > 0) return i18n.t("tripHelpers.daysUntil", { count: daysUntil });

  return i18n.t("tripHelpers.canAddLater");
}

export function getHeroTrip(trips) {
  const STATUS_PRIORITY = {
    ongoing: 0,
    upcoming: 1,
    completed: 2,
    cancelled: 3,
  };

  const candidates = (trips || [])
    .map((trip) => ({ trip, status: getDisplayStatus(trip) }))
    .filter(({ status }) => status !== "completed" && status !== "cancelled")
    .sort((a, b) => {
      const aPriority = STATUS_PRIORITY[a.status] ?? 99;
      const bPriority = STATUS_PRIORITY[b.status] ?? 99;
      if (aPriority !== bPriority) return aPriority - bPriority;
      const aDate = getSafeDateTime(a.trip.startDate, Number.MAX_SAFE_INTEGER);
      const bDate = getSafeDateTime(b.trip.startDate, Number.MAX_SAFE_INTEGER);
      return aDate - bDate;
    });

  return candidates[0]?.trip ?? null;
}

export function sortTripsForDashboard(trips) {
  const statusOrder = { ongoing: 0, upcoming: 1, completed: 2, cancelled: 3 };

  return [...(trips || [])].sort((a, b) => {
    const aStatus = getDisplayStatus(a);
    const bStatus = getDisplayStatus(b);
    const aOrder = statusOrder[aStatus] ?? 1;
    const bOrder = statusOrder[bStatus] ?? 1;

    if (aOrder !== bOrder) return aOrder - bOrder;

    const aDate = getSafeDateTime(a.startDate, Number.MAX_SAFE_INTEGER);
    const bDate = getSafeDateTime(b.startDate, Number.MAX_SAFE_INTEGER);

    if (aOrder <= 1) return aDate - bDate;
    return bDate - aDate;
  });
}

export function buildSummary(trips) {
  const safeTrips = trips || [];
  const activeCount = safeTrips.filter((trip) => {
    const status = getDisplayStatus(trip);
    return status === "upcoming" || status === "ongoing";
  }).length;
  const completedCount = safeTrips.filter((trip) => {
    const status = getDisplayStatus(trip);
    return status === "completed" || status === "cancelled";
  }).length;
  const totalDestinations = safeTrips.reduce(
    (sum, trip) => sum + (trip.destinations?.length || 0),
    0,
  );

  return [
    {
      key: "trips",
      icon: "luggage",
      value: String(safeTrips.length),
      label: i18n.t("tripHelpers.trip"),
      tone: "blue",
    },
    {
      key: "active",
      icon: "bolt",
      value: String(activeCount),
      label: i18n.t("tripHelpers.processing"),
      tone: "amber",
    },
    {
      key: "places",
      icon: "place",
      value: String(totalDestinations),
      label: i18n.t("tripHelpers.destination"),
      tone: "teal",
    },
    {
      key: "done",
      icon: "task-alt",
      value: String(completedCount),
      label: i18n.t("tripHelpers.done"),
      tone: "green",
    },
  ];
}

export function getSectionCopy(activeFilter, count) {
  if (activeFilter === "active") {
    return i18n.t("tripHelpers.sectionTracking", { count });
  }

  if (activeFilter === "done") {
    return i18n.t("tripHelpers.sectionCompleted", { count });
  }

  return i18n.t("tripHelpers.sectionAll", { count });
}

// ─── Trip Detail Helpers (shared with [id].jsx) ──────────────────────────────────

const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/**
 * Parse any date value into a safe Date object, or null on failure.
 */
export function toValidDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * Format a date string to dd/mm/yyyy.
 */
export function formatDateYmd(dateStr) {
  const date = toValidDate(dateStr);
  if (!date) return null;
  return formatDateDmy(date, { twoDigitYear: false });
}

/**
 * Format a Date object to YYYY-MM-DD string.
 */
export function toYmdString(dateObj) {
  if (!dateObj) return null;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a price (VND amount) as a localized string.
 */
export function formatPrice(amount) {
  const value = Number(amount || 0);
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  return `${value.toLocaleString(locale)} VND`;
}

/**
 * Format distance from meters into a human-readable string.
 * Returns meters for <1000m, kilometers for >=1000m.
 */
export const formatDistance = (kilometers) => {
  const km = parseFloat(kilometers);
  if (isNaN(km) || km <= 0) return null;
  
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  
  return `${km.toFixed(1).replace('.0', '')}km`;
};

/**
 * Format booking date/time for display.
 */
export function formatBookingDateTime(booking) {
  const useDate = String(booking?.useDate || "").slice(0, 10);
  const useTime = booking?.useTime || "--:--";
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";
  if (useDate) {
    const dateObj = new Date(`${useDate}T12:00:00`);
    const dateLabel = Number.isNaN(dateObj.getTime())
      ? useDate
      : dateObj.toLocaleDateString(locale, {
          day: "2-digit",
          month: "2-digit",
        });
    return `${dateLabel} • ${useTime}`;
  }

  if (booking?.bookingAt) {
    const bookingAt = toValidDate(booking.bookingAt);
    if (bookingAt) {
      return bookingAt.toLocaleString(locale, {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  return useTime;
}

/**
 * Calculate the total number of days for a trip.
 */
export function calcDayCount(trip) {
  if (!trip) return 1;
  if (trip.startDate && trip.endDate) {
    const start = toValidDate(trip.startDate);
    const end = toValidDate(trip.endDate);
    if (start && end) {
      const ms = end.getTime() - start.getTime();
      const days = Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : trip.totalDays || 1;
    }
  }
  return trip.totalDays || 1;
}

/**
 * Build an array of day descriptors for the trip.
 */
export function buildTripDays(trip) {
  const dayCount = calcDayCount(trip);
  const start = toValidDate(trip?.startDate);
  const normalizedStart = start ? new Date(start) : null;
  if (normalizedStart) normalizedStart.setHours(12, 0, 0, 0);
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";

  return Array.from({ length: dayCount }, (_, index) => {
    const dayNumber = index + 1;
    if (!normalizedStart) {
      return {
        dayNumber,
        hasDate: false,
        weekdayLabel: `Day ${dayNumber}`,
        dateLabel: "",
        dateYmd: null,
      };
    }

    const date = new Date(normalizedStart);
    date.setDate(normalizedStart.getDate() + index);

    return {
      dayNumber,
      hasDate: true,
      weekdayLabel: WEEKDAY_SHORT[date.getDay()] || "--",
      dateLabel: date.toLocaleDateString(locale, {
        day: "2-digit",
        month: "2-digit",
      }),
      dateYmd: toYmdString(date),
    };
  });
}

/**
 * Determine which day number a date falls on within a trip.
 */
export function getDayNumberFromDate(tripStartYmd, targetYmd, dayCount) {
  if (!tripStartYmd || !targetYmd) return null;
  const start = new Date(`${tripStartYmd}T12:00:00`);
  const target = new Date(`${targetYmd}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(target.getTime())) {
    return null;
  }

  const diffDays =
    Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
    1;

  if (diffDays < 1 || diffDays > dayCount) return null;
  return diffDays;
}

/**
 * Convert a "HH:MM" time string to minutes-since-midnight for sorting.
 */
export function toTimeSortValue(timeValue) {
  const raw = String(timeValue || "");
  const [hourRaw, minuteRaw] = raw.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return hour * 60 + minute;
}

/**
 * Sort bookings by day → time → creation time.
 */
export function sortBookingsByTime(a, b) {
  const dayA = Number(a?._dayNumber) || Number.MAX_SAFE_INTEGER;
  const dayB = Number(b?._dayNumber) || Number.MAX_SAFE_INTEGER;
  if (dayA !== dayB) return dayA - dayB;

  const timeA = toTimeSortValue(a?.useTime);
  const timeB = toTimeSortValue(b?.useTime);
  if (timeA !== timeB) return timeA - timeB;

  const createdA = toValidDate(a?.createdAt)?.getTime() || 0;
  const createdB = toValidDate(b?.createdAt)?.getTime() || 0;
  return createdB - createdA;
}

/**
 * Compute which bookings belong to a given trip.
 * A booking belongs if it is linked to the trip OR its place is in the trip's destinations
 * AND its useDate falls within the trip day range.
 */
export function buildTripDetailBookings({
  bookings,
  trip,
  tripDays,
  dayCount,
}) {
  if (!trip) return [];

  const tripIdStr = String(trip?.id);
  const tripStartYmd = tripDays[0]?.dateYmd || null;

  const tripPlaceIds = new Set(
    (trip.destinations || [])
      .map((dest) => dest?.place?.id != null ? String(dest.place.id) : null)
      .filter(Boolean),
  );

  return (bookings || [])
    .map((booking) => {
      const placeId = booking?.service?.place?.id != null ? String(booking.service.place.id) : null;
      const linkedTripId = booking?.linkedTrip?.id != null ? String(booking.linkedTrip.id) : null;
      const linkedDayNumber = Number(booking?.linkedTrip?.dayNumber);

      const fallbackDayNumber = getDayNumberFromDate(
        tripStartYmd,
        String(booking?.useDate || "").slice(0, 10),
        dayCount,
      );

      const dayNumber =
        Number.isInteger(linkedDayNumber) && linkedDayNumber > 0
          ? linkedDayNumber
          : fallbackDayNumber;

      const inTripDayRange =
        Number.isInteger(dayNumber) && dayNumber >= 1 && dayNumber <= dayCount;
      const inTripPlace =
        placeId != null && tripPlaceIds.has(placeId);
      const isLinkedToCurrentTrip =
        linkedTripId != null && linkedTripId === tripIdStr;

      if (!isLinkedToCurrentTrip && !(inTripPlace && inTripDayRange)) {
        return null;
      }

      return {
        ...booking,
        _placeId: booking?.service?.place?.id,
        _dayNumber: inTripDayRange ? dayNumber : null,
      };
    })
    .filter(Boolean)
    .sort(sortBookingsByTime);
}

/**
 * Group bookings by day for the Services tab.
 */
export function groupBookingsByDay(tripBookings, tripDays) {
  const dayGroups = new Map(
    tripDays.map((day) => [
      day.dayNumber,
      {
        dayNumber: day.dayNumber,
        label: day.hasDate
          ? `${day.weekdayLabel}, ${day.dateLabel}`
          : day.weekdayLabel,
        items: [],
      },
    ]),
  );

  const ungrouped = [];

  tripBookings.forEach((booking) => {
    const dayNumber = Number(booking?._dayNumber);
    const target = dayGroups.get(dayNumber);
    if (target) {
      target.items.push(booking);
    } else {
      ungrouped.push(booking);
    }
  });

  const groups = Array.from(dayGroups.values())
    .map((group) => ({
      ...group,
      items: group.items.slice().sort(sortBookingsByTime),
    }))
    .filter((group) => group.items.length > 0);

  if (ungrouped.length > 0) {
    groups.push({
      dayNumber: 0,
      label: i18n.t("tripHelpers.bookingNoDate"),
      items: ungrouped.slice().sort(sortBookingsByTime),
    });
  }

  return groups;
}

/**
 * Compute budget summary from a list of bookings.
 */
export function computeBudgetSummary(tripBookings) {
  const summary = {
    totalCount: tripBookings.length,
    totalAmount: 0,
    pendingAmount: 0,
    confirmedAmount: 0,
    completedAmount: 0,
    cancelledAmount: 0,
  };

  tripBookings.forEach((booking) => {
    const amount = Number(booking?.finalPrice || 0);
    const status = String(booking?.status || "").toLowerCase();

    if (status !== "cancelled" && status !== "no_show") {
      summary.totalAmount += amount;
    }
    if (status === "pending") summary.pendingAmount += amount;
    if (status === "confirmed") summary.confirmedAmount += amount;
    if (status === "completed") summary.completedAmount += amount;
    if (status === "cancelled" || status === "no_show") {
      summary.cancelledAmount += amount;
    }
  });

  return summary;
}

/**
 * Map destination IDs to their associated bookings.
 */
export function buildDestinationBookings(tripBookings, destinations) {
  const byDayPlace = new Map();

  tripBookings.forEach((booking) => {
    const dayNumber = Number(booking?._dayNumber);
    const placeId = booking?._placeId != null ? String(booking._placeId) : null;
    if (!Number.isInteger(dayNumber) || !placeId) return;

    const key = `${dayNumber}-${placeId}`;
    if (!byDayPlace.has(key)) byDayPlace.set(key, []);
    byDayPlace.get(key).push(booking);
  });

  const destinationMap = new Map();
  destinations.forEach((dest) => {
    const dayNumber = Number(dest?.dayNumber);
    const placeId = dest?.place?.id != null ? String(dest.place.id) : null;
    const key = `${dayNumber}-${placeId}`;
    destinationMap.set(
      dest.id,
      (byDayPlace.get(key) || []).slice().sort(sortBookingsByTime),
    );
  });

  return destinationMap;
}

// ─── Day list ───────────────────────────────────────────────────────────────

const DAY_MS = 86400000;

/**
 * Dựng danh sách ngày của chuyến đi cho các bộ chọn (day chips, modal chuyển ngày).
 * Mỗi phần tử: { dayNumber, date } — date là null nếu chuyến đi chưa có ngày bắt đầu.
 */
export function buildDayList(trip) {
  const total = calcDayCount(trip);
  const start = toValidDate(trip?.startDate);
  return Array.from({ length: total }, (_, index) => ({
    dayNumber: index + 1,
    date: start ? new Date(start.getTime() + index * DAY_MS) : null,
  }));
}

// ─── Time field helpers ───────────────────────────────────────────────────────

/**
 * Chuyển chuỗi "HH:MM" thành Date (chỉ phần giờ/phút), hoặc null nếu không hợp lệ.
 */
export function parseTimeToDate(str) {
  if (!str) return null;
  const [h, m] = String(str).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * Tính thời gian lưu trú (phút) từ startTime và endTime.
 * Trả về số phút hoặc null nếu thiếu dữ liệu.
 */
export function calcDurationMinutes(startTime, endTime) {
  const start = parseTimeToDate(startTime);
  const end = parseTimeToDate(endTime);
  if (!start || !end) return null;
  let diff = (end - start) / 60000;
  if (diff < 0) diff += 24 * 60;
  return Math.round(diff);
}

/**
 * Format số phút thành chuỗi dễ đọc, chính xác tới từng phút.
 * 45p → "45 phút", 90p → "1 giờ 30 phút", 120p → "2 giờ".
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} ${i18n.t("tripHelpers.minutes")}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} ${i18n.t("tripHelpers.hours")}`;
  return `${h} ${i18n.t("tripHelpers.hours")} ${m} ${i18n.t("tripHelpers.minutes")}`;
}

/**
 * Định dạng Date thành chuỗi "HH:MM".
 */
export function formatHHMM(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Nhãn thời gian hiển thị cho một điểm đến (start/end/qua hôm sau/chưa xếp giờ).
 */
export function formatDestinationTimeLabel(dest) {
  const hasStart = !!dest?.startTime;
  const hasEnd = !!dest?.endTime;
  const startMin = toTimeSortValue(dest?.startTime);
  const endMin = toTimeSortValue(dest?.endTime);
  const crossesMidnight =
    hasStart &&
    hasEnd &&
    startMin !== Number.MAX_SAFE_INTEGER &&
    endMin !== Number.MAX_SAFE_INTEGER &&
    endMin < startMin;

  if (hasStart && hasEnd) {
    return `${dest.startTime} – ${dest.endTime}${crossesMidnight ? ` ${i18n.t("tripHelpers.nextDay")}` : ""}`;
  }
  if (hasStart) return i18n.t("tripHelpers.startAt", { time: dest.startTime });
  if (hasEnd) return i18n.t("tripHelpers.endAt", { time: dest.endTime });
  return i18n.t("tripHelpers.noTime");
}

// ─── Transport helpers ────────────────────────────────────────────────────────

export const TRANSPORT_OPTIONS = [
  { label: i18n.t("tripHelpers.transportWalk"), value: "Đi bộ", icon: "directions-walk" },
  { label: i18n.t("tripHelpers.transportMotorbike"), value: "Xe máy", icon: "motorcycle" },
  { label: i18n.t("tripHelpers.transportCar"), value: "Xe hơi", icon: "directions-car" },
  { label: i18n.t("tripHelpers.transportBus"), value: "Xe buýt", icon: "directions-bus" },
  { label: i18n.t("tripHelpers.transportOther"), value: null, icon: "swap-vert" },
];

/**
 * Tên phương tiện thân thiện từ giá trị lưu trữ tự do.
 */
export function getTransportLabel(transport) {
  if (!transport) return null;
  const t = transport.toLowerCase();
  if (t.includes("walk") || t.includes("đi bộ")) return i18n.t("tripHelpers.transportWalk");
  if (t.includes("bike") || t.includes("xe máy") || t.includes("motorcycle")) return i18n.t("tripHelpers.transportMotorbike");
  if (t.includes("bus") || t.includes("buýt")) return i18n.t("tripHelpers.transportBus");
  if (t.includes("car") || t.includes("xe hơi") || t === "xe") return i18n.t("tripHelpers.transportCar");
  return transport;
}

/**
 * Icon MaterialIcons tương ứng phương tiện.
 */
export function getTransportIcon(transport) {
  if (!transport) return null;
  const t = transport.toLowerCase();
  if (t.includes("walk") || t.includes("đi bộ")) return "directions-walk";
  if (t.includes("bike") || t.includes("xe máy") || t.includes("motorcycle")) return "motorcycle";
  if (t.includes("bus") || t.includes("buýt")) return "directions-bus";
  if (t.includes("car") || t.includes("xe hơi") || t.includes("xe")) return "directions-car";
  return "swap-vert";
}

/**
 * Kiểm tra một option phương tiện có khớp với giá trị đã lưu hay không.
 */
export function isTransportSelected(stored, optionVal) {
  if (!stored && !optionVal) return true;
  if (!stored || !optionVal) return false;

  const s = stored.toLowerCase();
  const o = optionVal.toLowerCase();

  if (o.includes("đi bộ") || o.includes("walk")) {
    return s.includes("đi bộ") || s.includes("walk");
  }
  if (o.includes("xe máy") || o.includes("bike")) {
    return s.includes("xe máy") || s.includes("bike") || s.includes("motorcycle");
  }
  if (o.includes("xe buýt") || o.includes("bus") || o.includes("buýt")) {
    return s.includes("xe buýt") || s.includes("bus") || s.includes("buýt");
  }
  if (o.includes("xe hơi") || o.includes("car")) {
    return s.includes("xe hơi") || s.includes("car") || (s === "xe" && o === "xe hơi");
  }
  return s === o;
}
