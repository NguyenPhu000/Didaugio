import { Bike, Car, Footprints, Navigation } from "lucide-react";

export const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

export function formatDistance(meters) {
  if (!Number.isFinite(Number(meters))) return "";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds) {
  if (!Number.isFinite(Number(seconds))) return "";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

export async function calculateLegDistance(fromPlace, toPlace) {
  if (
    !fromPlace?.latitude ||
    !fromPlace?.longitude ||
    !toPlace?.latitude ||
    !toPlace?.longitude
  ) {
    return null;
  }

  try {
    const url =
      `${OSRM_BASE}/${fromPlace.longitude},${fromPlace.latitude};${toPlace.longitude},${toPlace.latitude}` +
      "?overview=false&steps=false";
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;
    const route = data.routes[0];
    return {
      distance: route.distance,
      duration: route.duration,
      distanceLabel: formatDistance(route.distance),
      durationLabel: formatDuration(route.duration),
    };
  } catch {
    return null;
  }
}

export const getTransportModes = (t) => [
  { value: t("admin.cms.motorbike"), icon: Bike, color: "text-orange-600", bg: "bg-orange-50" },
  { value: t("admin.cms.car"), icon: Car, color: "text-blue-600", bg: "bg-blue-50" },
  { value: t("admin.cms.walking"), icon: Footprints, color: "text-green-600", bg: "bg-green-50" },
  { value: t("admin.cms.bicycle"), icon: Bike, color: "text-teal-600", bg: "bg-teal-50" },
  { value: t("admin.cms.boat"), icon: Navigation, color: "text-cyan-600", bg: "bg-cyan-50" },
  { value: t("admin.cms.bus"), icon: Car, color: "text-indigo-600", bg: "bg-indigo-50" },
];

export function sortDestinations(destinations = []) {
  return [...destinations].sort((a, b) => {
    if ((a.dayNumber || 0) !== (b.dayNumber || 0)) {
      return (a.dayNumber || 0) - (b.dayNumber || 0);
    }
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    return (a.order || 0) - (b.order || 0);
  });
}

export function getDestinationCoordinates(destinations = []) {
  return sortDestinations(destinations)
    .map((destination) => {
      const latitude = Number(destination?.place?.latitude);
      const longitude = Number(destination?.place?.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      return {
        destination,
        latitude,
        longitude,
      };
    })
    .filter(Boolean);
}

export function getPlaceImage(place) {
  if (!place) return "";
  const coverImage = Array.isArray(place.images)
    ? place.images.find((image) => image?.isCover) || place.images[0]
    : null;
  return (
    place.thumbnail ||
    place.image ||
    place.imageUrl ||
    coverImage?.secureUrl ||
    coverImage?.thumbnailUrl ||
    coverImage?.imageData ||
    coverImage?.url ||
    (typeof coverImage === "string" ? coverImage : "")
  );
}

export function formatDateForViInput(value) {
  if (!value) return "";
  const normalized = typeof value === "string" ? value.split("T")[0] : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "";
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${parsed.getFullYear()}`;
}

export function parseViDateInput(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return undefined;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return undefined;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function countInclusiveDays(startYmd, endYmd) {
  if (!startYmd || !endYmd) return null;
  const start = new Date(startYmd);
  const end = new Date(endYmd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return null;
  }
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end - start) / msPerDay) + 1;
}
