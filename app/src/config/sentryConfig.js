export function getSentryOptions({ dsn, environment }) {
  const normalizedDsn = String(dsn || "").trim();
  if (!normalizedDsn) return null;

  return {
    dsn: normalizedDsn,
    environment: environment || "production",
    tracesSampleRate: environment === "production" ? 0.1 : 0.25,
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
