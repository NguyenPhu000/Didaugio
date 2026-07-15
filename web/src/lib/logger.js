const isDevelopment = import.meta.env.DEV;

function reportToMonitoring(error, context) {
  const sentry = globalThis.Sentry;

  if (typeof sentry?.captureException === "function") {
    sentry.captureException(error, { extra: context });
  }
}

export const logger = {
  error(message, error, context = {}) {
    if (isDevelopment) {
      console.error(message, error, context);
      return;
    }

    reportToMonitoring(error, { message, ...context });
  },
};
