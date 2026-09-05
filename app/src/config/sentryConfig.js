export function getSentryOptions({ dsn, environment, release }) {
  const normalizedDsn = String(dsn || "").trim();
  if (!normalizedDsn) return null;
  const normalizedEnvironment = String(environment || "production").trim() || "production";

  return {
    dsn: normalizedDsn,
    environment: normalizedEnvironment,
    ...(release ? { release } : {}),
    tracesSampleRate: normalizedEnvironment === "production" ? 0.1 : 0.25,
    sendDefaultPii: false,
    enableAutoSessionTracking: true,
    beforeSend(event) {
      delete event.user;
      delete event.request;
      return event;
    },
  };
}

export function isValidSentryDsn(dsn) {
  try {
    const url = new URL(String(dsn || "").trim());
    return url.protocol === "https:" && Boolean(url.username) && Boolean(url.hostname);
  } catch {
    return false;
  }
}
