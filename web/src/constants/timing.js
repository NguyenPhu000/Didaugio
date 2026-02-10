/**
 * TIMING & LIMIT CONSTANTS
 * Centralized timeouts, delays, and numeric limits
 */

// API
export const API_TIMEOUT = 30000; // 30 seconds

// Redirect delays (ms)
export const REDIRECT_DELAY = {
  DEFAULT: 2000,
  SHORT: 1500,
  LONG: 3000,
  AUTO: 5000,
};

// Toast durations (ms)
export const TOAST_DURATION = {
  DEFAULT: 3000,
  SUCCESS: 3000,
  ERROR: 5000,
  INFO: 4000,
  DEV: 10000,
};

// Polling / Intervals
export const INTERVALS = {
  REALTIME_UPDATE: 3000,
  ANIMATION: 3000,
};

// Cache
export const CACHE_TTL = {
  LOCATION: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// LocalStorage keys
export const STORAGE_KEYS = {
  AUTH: "auth-storage",
};

// Geolocation
export const CAN_THO_PROVINCE_CODE = "92";
