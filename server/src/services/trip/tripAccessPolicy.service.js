import ServiceError from "../../utils/serviceError.js";
import { ERROR_CODES } from "../../config/messages.js";

export const CAPABILITIES = Object.freeze({
  VIEW: "view",
  EDIT: "edit",
  DELETE: "delete",
  DUPLICATE: "duplicate",
  SAVE: "save",
  SHARE: "share",
  LINK_BOOKING: "link_booking",
  REORDER: "reorder",
  EXECUTE: "execute",
  // Temporary aliases for callers created during the earlier hardening pass.
  READ: "view",
  WRITE: "edit",
});

const OWNER_ONLY = new Set([
  CAPABILITIES.EDIT,
  CAPABILITIES.DELETE,
  CAPABILITIES.SHARE,
  CAPABILITIES.LINK_BOOKING,
  CAPABILITIES.REORDER,
  CAPABILITIES.EXECUTE,
]);

export function evaluateTripAccess(userId, tripPlan, capability = CAPABILITIES.VIEW) {
  if (!tripPlan) return { allowed: false, reason: "TRIP_NOT_FOUND" };

  const actorId = userId == null ? null : Number(userId);
  const isOwner = actorId != null && Number(tripPlan.userId) === actorId;
  if (isOwner) return { allowed: true };
  if (OWNER_ONLY.has(capability)) {
    return { allowed: false, reason: "TRIP_OWNER_REQUIRED" };
  }

  const isPublic = tripPlan.metadata?.isPublic === true;
  if (capability === CAPABILITIES.VIEW && isPublic) return { allowed: true };
  if (capability === CAPABILITIES.SAVE && isPublic && actorId != null) return { allowed: true };
  if (capability === CAPABILITIES.DUPLICATE && isPublic && actorId != null) return { allowed: true };

  return { allowed: false, reason: "TRIP_ACCESS_DENIED" };
}

export function assertTripAccess(userId, tripPlan, capability = CAPABILITIES.VIEW) {
  const result = evaluateTripAccess(userId, tripPlan, capability);
  if (result.allowed) return true;
  if (result.reason === "TRIP_NOT_FOUND") {
    throw new ServiceError("Không tìm thấy hành trình", 404, ERROR_CODES.NOT_FOUND);
  }
  throw new ServiceError(
    "Bạn không có quyền thực hiện thao tác này trên hành trình",
    403,
    ERROR_CODES.FORBIDDEN || "TRIP_ACCESS_DENIED",
  );
}
