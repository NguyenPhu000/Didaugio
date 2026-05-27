export const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Sắp tới" },
  { key: "done", label: "Hoàn thành" },
];

import { TRIP_STATUS_META } from "./tripTheme";

export const STATUS_THEME = TRIP_STATUS_META;

export function formatDate(dateStr) {
  if (!dateStr) return null;

  return new Date(dateStr).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function getDateRangeLabel(trip) {
  if (trip.startDate && trip.endDate) {
    return `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`;
  }

  if (trip.startDate) {
    return `Từ ${formatDate(trip.startDate)}`;
  }

  return "Chưa chọn ngày";
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
  if (!trip) return "draft";

  const rawStatus = String(trip.status || "").toLowerCase();
  if (rawStatus === "completed") return "completed";
  if (rawStatus === "cancelled") return "cancelled";
  if (rawStatus === "draft") return "draft";

  const daysUntil = getDaysUntil(trip.startDate);
  if (daysUntil === null) {
    return rawStatus === "draft" ? "draft" : "upcoming";
  }
  if (daysUntil < 0) {
    const endDaysUntil = getDaysUntil(trip.endDate);
    if (endDaysUntil !== null && endDaysUntil < 0) return "completed";
    return "ongoing";
  }
  return "upcoming";
}

export function getTimelineLabel(trip) {
  const displayStatus = getDisplayStatus(trip);
  if (displayStatus === "completed") return "Đã kết thúc";
  if (displayStatus === "cancelled") return "Không còn hiệu lực";
  if (displayStatus === "draft") return "Bản nháp · cần lên lịch";

  const daysUntil = getDaysUntil(trip.startDate);
  if (displayStatus === "ongoing") return "Đang trong hành trình";
  if (daysUntil === 0) return "Bắt đầu hôm nay";
  if (daysUntil === 1) return "Bắt đầu ngày mai";
  if (daysUntil !== null && daysUntil > 0) return `Còn ${daysUntil} ngày`;

  return "Có thể bổ sung sau";
}

export function getHeroTrip(trips) {
  const STATUS_PRIORITY = {
    ongoing: 0,
    upcoming: 1,
    draft: 2,
    completed: 3,
    cancelled: 4,
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

  return candidates[0]?.trip || trips?.[0] || null;
}

export function buildSummary(trips) {
  const safeTrips = trips || [];
  const activeCount = safeTrips.filter((trip) => {
    const status = getDisplayStatus(trip);
    return status === "draft" || status === "upcoming" || status === "ongoing";
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
      label: "Chuyến đi",
      tone: "blue",
    },
    {
      key: "active",
      icon: "bolt",
      value: String(activeCount),
      label: "Đang xử lý",
      tone: "amber",
    },
    {
      key: "places",
      icon: "place",
      value: String(totalDestinations),
      label: "Điểm đến",
      tone: "teal",
    },
    {
      key: "done",
      icon: "task-alt",
      value: String(completedCount),
      label: "Đã xong",
      tone: "green",
    },
  ];
}

export function getSectionCopy(activeFilter, count) {
  if (activeFilter === "active") {
    return `${count} hành trình đang được theo dõi sát sao.`;
  }

  if (activeFilter === "done") {
    return `${count} hành trình đã đóng lại để bạn xem nhanh hồ sơ cũ.`;
  }

  return `${count} hành trình trong một bảng điều khiển gọn gàng.`;
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
 * Format a date string to DD/MM/YYYY.
 */
export function formatDateYmd(dateStr) {
  const date = toValidDate(dateStr);
  if (!date) return null;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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
  return `${value.toLocaleString("vi-VN")}đ`;
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
  if (useDate) {
    const dateObj = new Date(`${useDate}T12:00:00`);
    const dateLabel = Number.isNaN(dateObj.getTime())
      ? useDate
      : dateObj.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
        });
    return `${dateLabel} • ${useTime}`;
  }

  if (booking?.bookingAt) {
    const bookingAt = toValidDate(booking.bookingAt);
    if (bookingAt) {
      return bookingAt.toLocaleString("vi-VN", {
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

  return Array.from({ length: dayCount }, (_, index) => {
    const dayNumber = index + 1;
    if (!normalizedStart) {
      return {
        dayNumber,
        hasDate: false,
        weekdayLabel: `Ngày ${dayNumber}`,
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
      dateLabel: date.toLocaleDateString("vi-VN", {
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
      label: "Booking chưa gắn ngày rõ ràng",
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

    summary.totalAmount += amount;
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
