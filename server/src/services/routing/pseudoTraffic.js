/**
 * Pseudo-traffic heuristic cho ETA chính xác hơn.
 * Dựa trên giờ cao điểm và ngày trong tuần.
 */

const HOURLY_FACTORS = [
  0.7, 0.7, 0.7, 0.7, 0.75, 0.8, 0.9, 1.3, 1.4, 1.2, 1.1, 1.1,
  1.15, 1.1, 1.05, 1.1, 1.2, 1.4, 1.35, 1.15, 1.0, 0.9, 0.8, 0.75,
];

const DAY_FACTORS = [0.85, 1.0, 1.0, 1.0, 1.0, 1.05, 0.9];

const WEATHER_FACTORS = {
  clear: 1.0, cloudy: 1.0, rain_light: 1.15, rain_heavy: 1.35, storm: 1.5,
};

export function getTrafficFactor(now = new Date(), weather = null) {
  const hour = now.getHours();
  const dayOfWeek = now.getDay();
  const hourlyFactor = HOURLY_FACTORS[hour] || 1.0;
  const dayFactor = DAY_FACTORS[dayOfWeek] || 1.0;
  const weatherFactor = weather ? (WEATHER_FACTORS[weather] || 1.0) : 1.0;
  const factor = Math.min(Math.max(hourlyFactor * dayFactor * weatherFactor, 0.5), 2.0);

  let label;
  if (factor >= 1.3) label = "Cao điểm";
  else if (factor >= 1.1) label = "Bình thường";
  else if (factor >= 0.9) label = "Ít xe";
  else label = "Rất ít xe";

  return {
    factor: Number(factor.toFixed(2)),
    label,
    hour,
    day: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][dayOfWeek],
    weather: weather || "unknown",
  };
}

export function applyTrafficFactor(durationSeconds, now = new Date(), weather = null) {
  const traffic = getTrafficFactor(now, weather);
  return {
    adjustedDuration: Math.round(durationSeconds * traffic.factor),
    trafficFactor: traffic,
  };
}

export function applyTrafficToResponse(response, now = new Date(), weather = null) {
  if (!response?.routes || !Array.isArray(response.routes)) return response;
  const traffic = getTrafficFactor(now, weather);
  const routes = response.routes.map((route) => ({
    ...route,
    durationInTraffic: Math.round((route.duration || 0) * traffic.factor),
    trafficInfo: { factor: traffic.factor, label: traffic.label, hour: traffic.hour, day: traffic.day },
  }));
  return { ...response, routes };
}
