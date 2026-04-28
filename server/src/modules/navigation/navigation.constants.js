const toPositiveInt = (value, fallbackValue) => {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return fallbackValue;
  }
  return Math.floor(normalized);
};

export const NAVIGATION_DOMAIN_NAME = "navigation";

export const NAVIGATION_EVENT_TYPES = Object.freeze([
  "navigation_started",
  "route_confirmed",
  "leg_arrived",
  "pending_confirm",
  "recovery_entered",
  "recovery_cleared",
  "route_deviation",
  "reroute_requested",
  "route_completed",
  "route_cancelled",
]);

export const NAVIGATION_UNKNOWN_EVENT_TYPE = "unknown";

export const NAVIGATION_MAX_BATCH_SIZE = toPositiveInt(
  process.env.NAVIGATION_TELEMETRY_MAX_BATCH_SIZE,
  100,
);

export const NAVIGATION_MAX_EVENTS_PER_SESSION = toPositiveInt(
  process.env.NAVIGATION_TELEMETRY_MAX_EVENTS_PER_SESSION,
  1200,
);

export const NAVIGATION_TELEMETRY_RETENTION_SEC = toPositiveInt(
  process.env.NAVIGATION_TELEMETRY_RETENTION_SEC,
  24 * 60 * 60,
);

export const NAVIGATION_TELEMETRY_SUMMARY_DEFAULT_WINDOW_MINUTES =
  toPositiveInt(process.env.NAVIGATION_TELEMETRY_SUMMARY_WINDOW_MINUTES, 60);
