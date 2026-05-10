export const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Sắp tới" },
  { key: "done", label: "Hoàn thành" },
];

export const STATUS_THEME = {
  draft: {
    label: "Nháp",
    bg: "#FFF4D6",
    text: "#B45309",
    accent: "#F59E0B",
    icon: "edit-calendar",
  },
  active: {
    label: "Đang diễn ra",
    bg: "#DBEAFE",
    text: "#1D4ED8",
    accent: "#2563EB",
    icon: "flight-takeoff",
  },
  completed: {
    label: "Đã hoàn thành",
    bg: "#DCFCE7",
    text: "#047857",
    accent: "#10B981",
    icon: "task-alt",
  },
  cancelled: {
    label: "Đã hủy",
    bg: "#FEE2E2",
    text: "#B91C1C",
    accent: "#EF4444",
    icon: "event-busy",
  },
};

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

export function getTimelineLabel(trip) {
  if (trip.status === "completed") return "Đã kết thúc";
  if (trip.status === "cancelled") return "Không còn hiệu lực";

  const daysUntil = getDaysUntil(trip.startDate);
  if (daysUntil === null) return "Có thể bổ sung sau";
  if (daysUntil < 0) return "Đang trong hành trình";
  if (daysUntil === 0) return "Bắt đầu hôm nay";
  if (daysUntil === 1) return "Bắt đầu ngày mai";

  return `Còn ${daysUntil} ngày`;
}

export function getHeroTrip(trips) {
  const candidates = trips
    .filter(
      (trip) => trip.status !== "completed" && trip.status !== "cancelled",
    )
    .sort((a, b) => {
      const aDate = a.startDate
        ? new Date(a.startDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bDate = b.startDate
        ? new Date(b.startDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    });

  return candidates[0] || trips[0] || null;
}

export function buildSummary(trips) {
  const activeCount = trips.filter(
    (trip) => trip.status === "active" || trip.status === "draft",
  ).length;
  const completedCount = trips.filter(
    (trip) => trip.status === "completed" || trip.status === "cancelled",
  ).length;
  const totalDestinations = trips.reduce(
    (sum, trip) => sum + (trip.destinations?.length || 0),
    0,
  );

  return [
    {
      key: "trips",
      icon: "luggage",
      value: String(trips.length),
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
export const formatDistance = (meters) => {
  const m = parseFloat(meters);
  if (isNaN(m)) return null;
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(1)}km`;
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

  const normalizedTripId = Number(trip?.id);
  const tripStartYmd = tripDays[0]?.dateYmd || null;

  const tripPlaceIds = new Set(
    (trip.destinations || [])
      .map((dest) => Number(dest?.place?.id))
      .filter((placeId) => Number.isInteger(placeId) && placeId > 0),
  );

  return (bookings || [])
    .map((booking) => {
      const placeId = Number(booking?.service?.place?.id);
      const linkedTripId = Number(booking?.linkedTrip?.id);
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
        Number.isInteger(placeId) && tripPlaceIds.has(placeId);
      const isLinkedToCurrentTrip =
        Number.isInteger(linkedTripId) && linkedTripId === normalizedTripId;

      if (!isLinkedToCurrentTrip && !(inTripPlace && inTripDayRange)) {
        return null;
      }

      return {
        ...booking,
        _placeId: placeId,
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
    const placeId = Number(booking?._placeId);
    if (!Number.isInteger(dayNumber) || !Number.isInteger(placeId)) return;

    const key = `${dayNumber}-${placeId}`;
    if (!byDayPlace.has(key)) byDayPlace.set(key, []);
    byDayPlace.get(key).push(booking);
  });

  const destinationMap = new Map();
  destinations.forEach((dest) => {
    const dayNumber = Number(dest?.dayNumber);
    const placeId = Number(dest?.place?.id);
    const key = `${dayNumber}-${placeId}`;
    destinationMap.set(
      dest.id,
      (byDayPlace.get(key) || []).slice().sort(sortBookingsByTime),
    );
  });

  return destinationMap;
}
