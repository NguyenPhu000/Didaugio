/**
 * Pseudo-traffic heuristic for Can Tho, Vietnam.
 * Zero external API cost — uses time-of-day, day-of-week, and optional weather
 * to estimate a traffic multiplier on top of OSRM base durations.
 */

// Hourly factors (0-23) local time (UTC+7)
const HOURLY_FACTORS = [
  0.7,  // 00
  0.7,  // 01
  0.7,  // 02
  0.7,  // 03
  0.7,  // 04
  0.7,  // 05
  0.9,  // 06
  1.3,  // 07  morning rush
  1.4,  // 08  peak morning
  1.2,  // 09
  1.1,  // 10
  1.1,  // 11
  1.15, // 12  noon
  1.1,  // 13
  1.05, // 14
  1.1,  // 15
  1.2,  // 16
  1.4,  // 17  peak evening
  1.35, // 18
  1.15, // 19
  1.0,  // 20
  0.9,  // 21
  0.8,  // 22
  0.75, // 23
];

// Day-of-week factors (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
const DAY_FACTORS = [
  0.85, // Sun
  1.0,  // Mon
  1.0,  // Tue
  1.0,  // Wed
  1.0,  // Thu
  1.05, // Fri
  0.9,  // Sat
];

// Weather factors (optional)
const WEATHER_FACTORS = {
  clear: 1.0,
  cloudy: 1.0,
  rain_light: 1.15,
  rain_heavy: 1.35,
  storm: 1.5,
};

const MIN_FACTOR = 0.5;
const MAX_FACTOR = 2.0;

/**
 * Derive a traffic label from the combined factor.
 * @param {number} factor
 * @returns {string}
 */
function getLabel(factor) {
  if (factor >= 1.3) return "Cao điểm";
  if (factor >= 1.1) return "Bình thường";
  if (factor >= 0.9) return "Ít xe";
  return "Rất ít xe";
}

/**
 * Get the current traffic factor.
 * @param {Date} [now] - Current time (defaults to now).
 * @param {string} [weather] - One of: clear, cloudy, rain_light, rain_heavy, storm.
 * @returns {{ factor: number, label: string, hour: number, day: number, weather: string|null }}
 */
export function getTrafficFactor(now = new Date(), weather = null) {
  // Convert to Vietnam time (UTC+7)
  const vnMs = now.getTime() + 7 * 60 * 60 * 1000;
  const vnDate = new Date(vnMs);

  const hour = vnDate.getUTCHours();
  const day = vnDate.getUTCDay(); // 0 = Sun

  const hourlyFactor = HOURLY_FACTORS[hour] ?? 1.0;
  const dayFactor = DAY_FACTORS[day] ?? 1.0;

  let weatherFactor = 1.0;
  if (weather && WEATHER_FACTORS[weather] !== undefined) {
    weatherFactor = WEATHER_FACTORS[weather];
  }

  const raw = hourlyFactor * dayFactor * weatherFactor;
  const factor = Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, Number(raw.toFixed(4))));

  return {
    factor,
    label: getLabel(factor),
    hour,
    day,
    weather: weather || null,
  };
}

/**
 * Apply traffic factor to a duration in seconds.
 * @param {number} durationSeconds
 * @param {Date} [now]
 * @param {string} [weather]
 * @returns {{ adjustedDuration: number, trafficFactor: number }}
 */
export function applyTrafficFactor(durationSeconds, now = new Date(), weather = null) {
  const { factor } = getTrafficFactor(now, weather);
  const adjustedDuration = Math.round(durationSeconds * factor);
  return { adjustedDuration, trafficFactor: factor };
}

/**
 * Apply traffic factor to a normalized routing response.
 * Mutates each route in-place: sets durationInTraffic and attaches trafficInfo.
 * @param {object} response - Normalized routing response (from _normalizeRouteResponse).
 * @param {Date} [now]
 * @param {string} [weather]
 * @returns {object} The same response object, mutated.
 */
export function applyTrafficToResponse(response, now = new Date(), weather = null) {
  if (!response || !Array.isArray(response.routes)) return response;

  const traffic = getTrafficFactor(now, weather);

  for (const route of response.routes) {
    const baseDuration = Number(route.duration || 0);
    route.durationInTraffic = Math.round(baseDuration * traffic.factor);
    route.trafficInfo = {
      factor: traffic.factor,
      label: traffic.label,
      hour: traffic.hour,
      day: traffic.day,
      weather: traffic.weather,
    };
  }

  return response;
}
