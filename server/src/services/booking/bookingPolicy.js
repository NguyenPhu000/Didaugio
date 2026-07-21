import { ERROR_CODES } from "../../config/messages.js";

const BLOCKING_STATUSES = ["pending", "confirmed"];
const DEFAULT_OCCUPIED_DURATION_MINUTES = 60;

function isPositiveNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function toValidDate(value, name) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`${name} must be a valid date`);
  }
  return date;
}

function bookingResourceRequiredError() {
  const error = new Error("Resource ID is required for resource bookings");
  error.code = ERROR_CODES.BOOKING_RESOURCE_REQUIRED;
  return error;
}

export function resolveBookingModel(service) {
  return service?.bookingModel === "resource" ? "resource" : "capacity";
}

export function resolveOccupiedDurationMinutes(service) {
  if (isPositiveNumber(service?.slotDurationMinutes)) {
    return service.slotDurationMinutes;
  }
  if (isPositiveNumber(service?.durationMinutes)) {
    return service.durationMinutes;
  }
  return DEFAULT_OCCUPIED_DURATION_MINUTES;
}

export function resolveBufferMinutes(service) {
  return isPositiveNumber(service?.bufferMinutes) ? service.bufferMinutes : 0;
}

export function resolveOccupiedInterval(service, bookingAt) {
  const startTime = toValidDate(bookingAt, "bookingAt");
  const occupiedMinutes = resolveOccupiedDurationMinutes(service) + resolveBufferMinutes(service);
  const endTime = new Date(startTime.getTime() + occupiedMinutes * 60_000);
  return { startTime, endTime };
}

export function intervalsOverlap(left, right) {
  const leftStart = toValidDate(left?.startTime, "left.startTime");
  const leftEnd = toValidDate(left?.endTime, "left.endTime");
  const rightStart = toValidDate(right?.startTime, "right.startTime");
  const rightEnd = toValidDate(right?.endTime, "right.endTime");
  return leftStart < rightEnd && leftEnd > rightStart;
}

export function isBlockingBooking(booking) {
  return booking?.deletedAt === null && BLOCKING_STATUSES.includes(booking.status);
}

export function normalizeRequestedResourceId(service, resourceId) {
  if (resolveBookingModel(service) !== "resource") return null;
  if (resourceId === null || resourceId === undefined || resourceId === "") {
    throw bookingResourceRequiredError();
  }

  const normalized = typeof resourceId === "string" ? Number(resourceId) : resourceId;
  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw bookingResourceRequiredError();
  }
  return normalized;
}

export function allowsCapacityOverbooking(service) {
  return service?.allowOverbooking === true;
}

export function buildBlockingBookingWhere({
  serviceId,
  resourceId,
  startTime,
  endTime,
  excludeBookingId,
}) {
  const where = {
    serviceId,
    status: { in: BLOCKING_STATUSES },
    deletedAt: null,
    startTime: { not: null, lt: endTime },
    endTime: { not: null, gt: startTime },
  };

  if (resourceId !== undefined && resourceId !== null) where.resourceId = resourceId;
  if (excludeBookingId !== undefined && excludeBookingId !== null) where.id = { not: excludeBookingId };
  return where;
}
