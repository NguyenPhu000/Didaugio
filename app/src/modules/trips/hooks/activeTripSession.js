const TERMINAL_SESSION_STATUSES = new Set(["completed", "cancelled"]);

const toLocalCalendarDate = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    const ymdMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      const [, year, month, day] = ymdMatch;
      return new Date(Number(year), Number(month) - 1, Number(day), 12);
    }
  }

  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(12, 0, 0, 0);
  return date;
};

export function getScheduledTripDayNumber({ startDate, now = new Date() } = {}) {
  const start = toLocalCalendarDate(startDate);
  const current = toLocalCalendarDate(now);
  if (!start || !current) return null;

  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const currentUtc = Date.UTC(
    current.getFullYear(),
    current.getMonth(),
    current.getDate(),
  );
  const elapsedDays = Math.floor((currentUtc - startUtc) / 86_400_000);
  return elapsedDays >= 0 ? elapsedDays + 1 : null;
}

export function getNextScheduledDestination({
  destinations = [],
  visitedIds = [],
  scheduledDayNumber = null,
} = {}) {
  const ordered = [...destinations].sort((first, second) => {
    const dayDelta = Number(first?.dayNumber || 1) - Number(second?.dayNumber || 1);
    if (dayDelta !== 0) return dayDelta;
    return Number(first?.order || 0) - Number(second?.order || 0);
  });
  const dayNumber = Number(scheduledDayNumber);
  const candidates = Number.isInteger(dayNumber) && dayNumber > 0
    ? ordered.filter((destination) => Number(destination?.dayNumber || 1) === dayNumber)
    : ordered;

  return candidates.find((destination) => !visitedIds.includes(destination.id)) || null;
}

export function normalizeServerTripSession(session) {
  if (!session || typeof session !== "object") return null;

  const status = String(session.status || "").toLowerCase();
  if (TERMINAL_SESSION_STATUSES.has(status)) {
    return {
      visitedIds: [],
      isPaused: false,
      shouldClearActiveTrip: true,
      version: Number(session.clientStateVersion || 0),
    };
  }

  const visitedIds = Array.isArray(session.metadata?.visitedIds)
    ? session.metadata.visitedIds
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    : [];

  return {
    visitedIds,
    isPaused: status === "paused",
    version: Number(session.clientStateVersion || 0),
  };
}
