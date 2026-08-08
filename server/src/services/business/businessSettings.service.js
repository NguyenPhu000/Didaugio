import prisma from "../../config/prismaClient.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";

const DEFAULT_BUSINESS_SETTINGS = {
  general: {
    displayName: "",
    description: "",
    logoUrl: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
    operatingHours: {
      monday: { open: "08:00", close: "22:00", closed: false },
      tuesday: { open: "08:00", close: "22:00", closed: false },
      wednesday: { open: "08:00", close: "22:00", closed: false },
      thursday: { open: "08:00", close: "22:00", closed: false },
      friday: { open: "08:00", close: "22:00", closed: false },
      saturday: { open: "08:00", close: "22:00", closed: false },
      sunday: { open: "08:00", close: "22:00", closed: false },
    },
  },
  bookingRules: {
    maxAdvanceDays: 30,
    minLeadMinutes: 0,
    allowOverbooking: false,
    autoApprove: false,
    cancellationWindowHours: 24,
    noShowPolicy: "charge_50",
  },
  notifications: {
    newBookingEmail: true,
    newBookingPush: true,
    newReviewEmail: true,
    newReviewPush: false,
    bookingCancelledEmail: true,
    cancellationEmail: true,
    cancellationPush: true,
    payoutEmail: true,
  },
};

function mergeDefaults(target, source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return target;
  }
  const out = { ...target };
  for (const key of Object.keys(target)) {
    if (!(key in source)) continue;
    const sv = source[key];
    const tv = target[key];
    if (
      sv &&
      typeof sv === "object" &&
      !Array.isArray(sv) &&
      tv &&
      typeof tv === "object" &&
      !Array.isArray(tv)
    ) {
      out[key] = mergeDefaults(tv, sv);
    } else {
      out[key] = sv;
    }
  }
  return out;
}

function mergeStoredSettings(stored, payload) {
  const current = stored && typeof stored === "object" && !Array.isArray(stored)
    ? stored
    : {};
  return {
    ...current,
    ...payload,
    general: { ...(current.general || {}), ...(payload.general || {}) },
    bookingRules: { ...(current.bookingRules || {}), ...(payload.bookingRules || {}) },
    notifications: { ...(current.notifications || {}), ...(payload.notifications || {}) },
  };
}

export function getPublicBusinessSettings(settings) {
  const normalized = mergeDefaults(
    structuredClone(DEFAULT_BUSINESS_SETTINGS),
    settings,
  );
  const general = normalized.general;
  return {
    displayName: String(general.displayName || "").trim(),
    description: String(general.description || "").trim(),
    logoUrl: String(general.logoUrl || "").trim(),
    contactPhone: String(general.contactPhone || "").trim(),
    contactEmail: String(general.contactEmail || "").trim(),
    address: String(general.address || "").trim(),
    operatingHours: general.operatingHours || {},
  };
}

export function applyBusinessDisplaySettings(business) {
  if (!business) return business;

  const { settings: _settings, ...publicBusiness } = business;
  const publicSettings = getPublicBusinessSettings(business.settings);
  return {
    ...publicBusiness,
    displayName: publicSettings.displayName || business.businessName || "",
    publicProfile: publicSettings,
  };
}

export function getPublicBusinessOpeningHours(settings) {
  const configuredHours = settings?.general?.operatingHours;
  if (!configuredHours || typeof configuredHours !== "object") return null;

  const dayKeys = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return dayKeys.map((dayKey, dayOfWeek) => {
    const hours = configuredHours[dayKey] || {
      open: "08:00",
      close: "22:00",
      closed: false,
    };
    return {
      dayOfWeek,
      isClosed: hours.closed === true,
      openTime: hours.closed === true ? null : hours.open || null,
      closeTime: hours.closed === true ? null : hours.close || null,
      note: "business_settings",
    };
  });
}

export function applyPlaceBusinessSettings(place) {
  if (!place) return place;

  const business = place.business;
  const openingHours = getPublicBusinessOpeningHours(business?.settings);
  return {
    ...place,
    ...(openingHours ? { openingHours } : {}),
    business: applyBusinessDisplaySettings(business),
  };
}

export async function getSettings(businessId) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { settings: true },
  });
  if (!business) {
    throw new ServiceError(
      "Doanh nghiệp không tồn tại",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }
  const base = structuredClone(DEFAULT_BUSINESS_SETTINGS);
  const stored = business.settings;
  if (!stored || typeof stored !== "object") {
    return base;
  }
  return mergeDefaults(base, stored);
}

export async function updateSettings(businessId, payload) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { settings: true },
  });
  if (!business) {
    throw new ServiceError(
      "Doanh nghiá»‡p khÃ´ng tá»“n táº¡i",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  const stored = mergeStoredSettings(business.settings, payload);

  await prisma.business.update({
    where: { id: businessId },
    data: { settings: stored },
  });

  return mergeDefaults(structuredClone(DEFAULT_BUSINESS_SETTINGS), stored);
}
