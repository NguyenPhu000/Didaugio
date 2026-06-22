import { MAP_TEXT } from "../constants/mapText.constants";

export const formatRouteEta = (seconds) => {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total <= 0) return null;

  if (total > 3600) return null;

  const minutes = Math.max(1, Math.round(total / 60));
  if (minutes < 60) return `${minutes} ${MAP_TEXT.routeFormatting.minuteUnit}`;

  const hours = Math.floor(minutes / 60);
  const remain = minutes % 60;
  return remain > 0
    ? `${hours}${MAP_TEXT.routeFormatting.hourUnit} ${remain}${MAP_TEXT.routeFormatting.minuteShortUnit}`
    : `${hours}${MAP_TEXT.routeFormatting.hourUnit}`;
};

export const formatRouteDistance = (meters) => {
  const total = Number(meters);
  if (!Number.isFinite(total) || total <= 0) return null;

  if (total > 50000) {
    return `Liên tỉnh (~${Math.round(total / 1000)} km)`;
  }

  if (total < 1000)
    return `${Math.round(total)} ${MAP_TEXT.routeFormatting.meterUnit}`;
  return `${(total / 1000).toFixed(1).replace(/\.0$/, "")} ${MAP_TEXT.routeFormatting.kilometerUnit}`;
};
