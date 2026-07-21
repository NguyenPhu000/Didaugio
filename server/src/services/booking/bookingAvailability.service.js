import { BOOKING_STATUS } from "../../config/constants.js";
import { ERROR_CODES } from "../../config/messages.js";
import prisma from "../../config/prismaClient.js";
import {
  combineUseDateAndTime,
  endOfMinuteUtc,
  startOfMinuteUtc,
  toUseDateOnly,
} from "../../utils/bookingTimeSlot.js";
import ServiceError from "../../utils/serviceError.js";
import {
  allowsCapacityOverbooking,
  buildBlockingBookingWhere,
  normalizeRequestedResourceId,
  resolveBufferMinutes,
  resolveBookingModel,
  resolveOccupiedDurationMinutes,
  resolveOccupiedInterval,
} from "./bookingPolicy.js";

const ACTIVE_STATUSES = [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED];

function assertAvailabilityInput(serviceId, dateStr) {
  const normalizedServiceId = Number(serviceId);
  if (!Number.isInteger(normalizedServiceId) || normalizedServiceId <= 0) {
    throw new ServiceError("serviceId không hợp lệ", 400, "INVALID_PARAMS");
  }

  if (typeof dateStr !== "string") {
    throw new ServiceError("Định dạng date không hợp lệ (YYYY-MM-DD)", 400, "INVALID_PARAMS");
  }

  try {
    // This intentionally parses the calendar string before any database lookup.
    combineUseDateAndTime(dateStr, "00:00");
  } catch {
    throw new ServiceError("Định dạng date không hợp lệ (YYYY-MM-DD)", 400, "INVALID_PARAMS");
  }

  return normalizedServiceId;
}

function vietnamDayBounds(dateStr) {
  const start = combineUseDateAndTime(dateStr, "00:00");
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

function formatVietnamTime(date) {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

/**
 * @param {import("@prisma/client").Prisma.TransactionClient} tx
 * @param {number} bookingId
 */
export async function lockBookingRow(tx, bookingId) {
  const id = parseInt(String(bookingId), 10);
  await tx.$executeRaw`SELECT id FROM bookings WHERE id = ${id} FOR UPDATE`;
}

/**
 * Check resource overlap for RESOURCE booking model (tables, rooms, seats).
 * Two bookings overlap if: existing.startTime < new.endTime AND existing.endTime > new.startTime.
 * @param {import("@prisma/client").Prisma.TransactionClient} tx
 * @param {{ serviceId: number, startTime: Date, endTime: Date, resourceId: number, excludeBookingId?: number }} payload
 */
export async function checkResourceOverlap(tx, payload) {
  const { serviceId, startTime, endTime, resourceId, excludeBookingId } = payload;

  if (!startTime || !endTime) {
    return { ok: true, overlappingBookings: [] };
  }

  const where = buildBlockingBookingWhere({
    serviceId,
    resourceId,
    startTime,
    endTime,
    excludeBookingId,
  });

  const overlapping = await tx.booking.findMany({
    where,
    select: {
      id: true,
      bookingCode: true,
      startTime: true,
      endTime: true,
      guestName: true,
    },
  });

  return {
    ok: overlapping.length === 0,
    overlappingBookings: overlapping,
  };
}

/**
 * @param {import("@prisma/client").Prisma.TransactionClient} tx
 * @param {{ serviceId: number; bookingAt: Date; quantity: number; resourceId?: number; excludeBookingId?: number }} payload
 */
export async function checkAvailability(tx, payload) {
  const { serviceId, bookingAt, quantity, resourceId: requestedResourceId, excludeBookingId } = payload;

  // Lock service row to serialize concurrent booking requests for the same service.
  // Prevents race condition where two transactions read the same capacity count.
  await tx.$executeRaw`SELECT id FROM business_services WHERE id = ${serviceId} FOR UPDATE`;

  const svc = await tx.businessService.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      maxCapacity: true,
      businessId: true,
      placeId: true,
      bookingModel: true,
      slotDurationMinutes: true,
      durationMinutes: true,
      bufferMinutes: true,
      allowOverbooking: true,
      allowOverbooking: true,
    },
  });
  if (!svc) {
    return { ok: false, used: 0, capacity: 0, reason: "NO_SERVICE" };
  }

  if (resolveBookingModel(svc) === "resource") {
    let resourceId;
    try {
      resourceId = normalizeRequestedResourceId(svc, requestedResourceId);
    } catch (error) {
      return {
        ok: false,
        used: 0,
        capacity: 0,
        reason: "RESOURCE_REQUIRED",
      };
    }

    await tx.$executeRaw`SELECT id FROM place_resources WHERE id = ${resourceId} FOR UPDATE`;
    const resource = await tx.placeResource.findUnique({
      where: { id: resourceId },
      select: {
        id: true,
        status: true,
        serviceId: true,
        placeId: true,
        capacity: true,
      },
    });

    if (
      !resource ||
      resource.status !== "active" ||
      resource.serviceId !== svc.id ||
      resource.placeId !== svc.placeId
    ) {
      return {
        ok: false,
        used: 0,
        capacity: resource?.capacity ?? 0,
        reason: "RESOURCE_INVALID",
      };
    }

    if (Number.isInteger(resource.capacity) && resource.capacity > 0 && quantity > resource.capacity) {
      return {
        ok: false,
        used: 0,
        capacity: resource.capacity,
        reason: "RESOURCE_INVALID",
      };
    }

    const bookingDate = toUseDateOnly(bookingAt);
    const blocked = await tx.businessBlockedDate.findFirst({
      where: {
        businessId: svc.businessId,
        date: bookingDate,
        OR: [{ serviceId: null }, { serviceId }],
      },
    });
    if (blocked) {
      return { ok: false, used: 0, capacity: 0, reason: "BLOCKED_DATE" };
    }

    const { startTime, endTime } = resolveOccupiedInterval(svc, bookingAt);
    const overlapResult = await checkResourceOverlap(tx, {
      serviceId,
      startTime,
      endTime,
      resourceId,
      excludeBookingId,
    });

    if (!overlapResult.ok) {
      return {
        ok: false,
        used: 0,
        capacity: resource.capacity ?? 1,
        reason: "RESOURCE_OVERLAP",
        resourceId,
        startTime,
        endTime,
        overlappingBookings: overlapResult.overlappingBookings,
      };
    }

    return {
      ok: true,
      used: 0,
      capacity: resource.capacity ?? 1,
      resourceId,
      startTime,
      endTime,
    };
  }

  // Check blocked dates
  const bookingDate = toUseDateOnly(bookingAt);
  const blocked = await tx.businessBlockedDate.findFirst({
    where: {
      businessId: svc.businessId,
      date: bookingDate,
      OR: [{ serviceId: null }, { serviceId }],
    },
  });
  if (blocked) {
    return { ok: false, used: 0, capacity: 0, reason: "BLOCKED_DATE" };
  }

  const cap = svc.maxCapacity ?? 999_999;
  const start = startOfMinuteUtc(new Date(bookingAt));
  const end = endOfMinuteUtc(start);

  const agg = await tx.booking.aggregate({
    where: {
      serviceId,
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      status: { in: ACTIVE_STATUSES },
      deletedAt: null,
      bookingAt: { gte: start, lt: end },
    },
    _sum: { quantity: true },
  });

  const used = agg._sum.quantity || 0;
  const overbookingAllowed = allowsCapacityOverbooking(svc);
  return {
    ok: overbookingAllowed || used + quantity <= cap,
    used,
    capacity: cap,
    resourceId: null,
    startTime: null,
    endTime: null,
    ...(overbookingAllowed || used + quantity <= cap
      ? {}
      : { reason: "CAPACITY_EXCEEDED" }),
  };
}

/**
 * Convert an availability failure into the stable API error contract.
 * @param {{ ok: boolean; reason?: string }} availability
 */
export function assertAvailability(availability) {
  if (availability.ok) return;

  const failures = {
    RESOURCE_REQUIRED: [
      "Phải chọn tài nguyên cho dịch vụ này",
      400,
      ERROR_CODES.BOOKING_RESOURCE_REQUIRED,
    ],
    RESOURCE_INVALID: [
      "Tài nguyên không hợp lệ cho dịch vụ hoặc địa điểm này",
      400,
      ERROR_CODES.BOOKING_RESOURCE_INVALID,
    ],
    RESOURCE_OVERLAP: [
      "Tài nguyên đã được đặt trong khung giờ này",
      409,
      ERROR_CODES.BOOKING_SLOT_CONFLICT,
    ],
    CAPACITY_EXCEEDED: [
      "Khung giờ đã hết chỗ",
      409,
      ERROR_CODES.BOOKING_CAPACITY_EXCEEDED,
    ],
  };
  const [message, statusCode, errorCode] = failures[availability.reason] || [
    "Khung giờ không còn khả dụng",
    409,
    ERROR_CODES.CONFLICT,
  ];
  throw new ServiceError(message, statusCode, errorCode);
}

/**
 * Real-time slot availability for mobile app - returns available slots for a date.
 * @param {number} serviceId
 * @param {string} dateStr - YYYY-MM-DD format
 */
export async function getAvailableSlots(serviceId, dateStr) {
  const normalizedServiceId = assertAvailabilityInput(serviceId, dateStr);
  const service = await prisma.businessService.findUnique({
    where: { id: normalizedServiceId },
    select: {
      id: true,
      maxCapacity: true,
      bookingModel: true,
      slotDurationMinutes: true,
      durationMinutes: true,
      bufferMinutes: true,
      businessId: true,
      placeId: true,
    },
  });

  if (!service) {
    throw new ServiceError("Dịch vụ không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

  const bookingModel = resolveBookingModel(service);
  const slotDurationMinutes = resolveOccupiedDurationMinutes(service);
  const bufferMinutes = resolveBufferMinutes(service);

  // Check if date is blocked
  const bookingDate = toUseDateOnly(dateStr);
  const blocked = await prisma.businessBlockedDate.findFirst({
    where: {
      businessId: service.businessId,
      date: bookingDate,
      OR: [{ serviceId: null }, { serviceId }],
    },
  });

  if (blocked) {
    if (bookingModel === "resource") {
      return {
        date: dateStr,
        serviceId: normalizedServiceId,
        available: false,
        reason: "BLOCKED_DATE",
        bookingModel,
        slotDurationMinutes,
        bufferMinutes,
        resources: [],
      };
    }
    return {
      date: dateStr,
      serviceId: normalizedServiceId,
      available: false,
      reason: "BLOCKED_DATE",
      slots: [],
    };
  }

  const { start: startOfDay, end: endOfDay } = vietnamDayBounds(dateStr);
  const cap = service.maxCapacity ?? 999_999;

  if (bookingModel === "resource") {
    const resources = (await prisma.placeResource.findMany({
      where: {
        serviceId: normalizedServiceId,
        placeId: service.placeId,
        status: "active",
      },
      select: {
        id: true,
        name: true,
        code: true,
        resourceType: true,
        capacity: true,
      },
      orderBy: [{ position: "asc" }, { id: "asc" }],
    })).filter((resource) =>
      resource.status === undefined || (
        resource.status === "active" &&
        resource.serviceId === normalizedServiceId &&
        resource.placeId === service.placeId
      ),
    );

    const resourceIds = resources.map((resource) => resource.id);
    const resourceBookings = resourceIds.length === 0
      ? []
      : await prisma.booking.findMany({
        where: {
          serviceId: normalizedServiceId,
          resourceId: { in: resourceIds },
          status: { in: ACTIVE_STATUSES },
          deletedAt: null,
          startTime: { not: null, lt: endOfDay },
          endTime: { not: null, gt: startOfDay },
        },
        select: { resourceId: true, startTime: true, endTime: true },
      });

    const resourcesWithSlots = resources.map((resource) => ({
      id: resource.id,
      name: resource.name,
      code: resource.code,
      resourceType: resource.resourceType,
      capacity: resource.capacity,
      bookedSlots: resourceBookings
        .filter((booking) => booking.resourceId === resource.id)
        .map((booking) => ({
          startTime: booking.startTime,
          endTime: booking.endTime,
        })),
    }));

    return {
      date: dateStr,
      serviceId: normalizedServiceId,
      available: resourcesWithSlots.length > 0,
      bookingModel: "resource",
      slotDurationMinutes,
      bufferMinutes,
      resources: resourcesWithSlots,
    };
  }

  const activeBookings = await prisma.booking.findMany({
    where: {
      serviceId: normalizedServiceId,
      status: { in: ACTIVE_STATUSES },
      deletedAt: null,
      bookingAt: { gte: startOfDay, lt: endOfDay },
    },
    select: {
      bookingAt: true,
      quantity: true,
    },
  });

  const SLOT_INTERVAL_MINUTES = 30;
  const overbookingAllowed = allowsCapacityOverbooking(service);
  const slots = [];
  const now = new Date();
  const isToday = dateStr === toUseDateOnly(now).toISOString().slice(0, 10);

  for (let hour = 6; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_INTERVAL_MINUTES) {
      const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      const slotStart = combineUseDateAndTime(dateStr, time);

      if (isToday && slotStart <= now) continue;

      const usedQty = activeBookings
        .filter((booking) => booking.bookingAt && startOfMinuteUtc(booking.bookingAt).getTime() === slotStart.getTime())
        .reduce((sum, booking) => sum + booking.quantity, 0);
      const available = overbookingAllowed || usedQty < cap;

      slots.push({
        time: formatVietnamTime(slotStart),
        startTime: slotStart.toISOString(),
        available,
        remaining: Math.max(0, cap - usedQty),
        capacity: cap,
      });
    }
  }

  return {
    date: dateStr,
    serviceId: normalizedServiceId,
    available: slots.some((s) => s.available),
    bookingModel: "capacity",
    slots,
  };
}
