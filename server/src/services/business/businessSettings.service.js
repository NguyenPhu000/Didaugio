import prisma from "../../config/prismaClient.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";

const DEFAULT_BUSINESS_SETTINGS = {
  general: { displayName: "", description: "", logoUrl: "" },
  bookingRules: {
    maxAdvanceDays: 30,
    minLeadMinutes: 0,
    allowOverbooking: false,
    autoApprove: false,
  },
  notifications: {
    newBookingEmail: true,
    newBookingPush: true,
    newReviewEmail: true,
    newReviewPush: false,
    bookingCancelledEmail: true,
  },
};

function deepMerge(target, source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return target;
  }
  const out = { ...target };
  for (const key of Object.keys(source)) {
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
      out[key] = deepMerge(tv, sv);
    } else {
      out[key] = sv;
    }
  }
  return out;
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
  return deepMerge(base, stored);
}

export async function updateSettings(businessId, payload) {
  const current = await getSettings(businessId);
  const merged = deepMerge(current, payload);

  await prisma.business.update({
    where: { id: businessId },
    data: { settings: merged },
  });

  return merged;
}
