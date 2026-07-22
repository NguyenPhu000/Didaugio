const TERMINAL_SESSION_STATUSES = new Set(["completed", "cancelled"]);

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
