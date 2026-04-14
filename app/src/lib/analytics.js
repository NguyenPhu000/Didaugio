const MAX_PAYLOAD_SIZE = 4096;

const safeSerialize = (value) => {
  try {
    const json = JSON.stringify(value || {});
    return json.length > MAX_PAYLOAD_SIZE
      ? `${json.slice(0, MAX_PAYLOAD_SIZE)}...`
      : json;
  } catch {
    return "{}";
  }
};

/**
 * Lightweight analytics wrapper.
 * - If global analytics SDK is injected (analytics.track), it will be used.
 * - Otherwise, fallback to dev console logging.
 */
export const trackEvent = (eventName, payload = {}) => {
  if (!eventName) return false;

  try {
    const sdk = globalThis?.analytics;
    if (sdk && typeof sdk.track === "function") {
      sdk.track(eventName, payload);
      return true;
    }
  } catch {
    // Ignore SDK errors, fallback to debug log.
  }

  if (__DEV__) {
    console.log(`[analytics:fallback] ${eventName} ${safeSerialize(payload)}`);
  }

  return false;
};

export default {
  trackEvent,
};
