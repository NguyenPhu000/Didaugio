import { BOOKING_STATUS } from "../../config/constants.js";
import { ERROR_CODES } from "../../config/messages.js";
import prisma from "../../config/prismaClient.js";
import {
  endOfMinuteUtc,
  startOfMinuteUtc,
  toUseDateOnly,
} from "../../utils/bookingTimeSlot.js";
import ServiceError from "../../utils/serviceError.js";
import {
  allowsCapacityOverbooking,
  buildBlockingBookingWhere,
  normalizeRequestedResourceId,
  resolveBookingModel,
  resolveOccupiedInterval,
} from "./bookingPolicy.js";

const ACTIVE_STATUSES = [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED];

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
  const service = await prisma.businessService.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      maxCapacity: true,
      bookingModel: true,
      slotDurationMinutes: true,
      bufferMinutes: true,
      businessId: true,
    },
  });

  if (!service) {
    throw new ServiceError("Dịch vụ không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

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
    return {
      date: dateStr,
      serviceId,
      available: false,
      reason: "BLOCKED_DATE",
      slots: [],
    };
  }

  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
  const cap = service.maxCapacity ?? 999_999;

  const activeBookings = await prisma.booking.findMany({
    where: {
      serviceId,
      status: { in: ACTIVE_STATUSES },
      bookingAt: { gte: startOfDay, lte: endOfDay },
    },
    select: {
      bookingAt: true,
      quantity: true,
      startTime: true,
      endTime: true,
      status: true,
    },
  });

  if (service.bookingModel === "resource") {
    const bookedSlots = activeBookings
      .filter((b) => b.startTime && b.endTime)
      .map((b) => ({
        startTime: b.startTime,
        endTime: b.endTime,
      }));

    return {
      date: dateStr,
      serviceId,
      available: true,
      bookingModel: "resource",
      bookedSlots,
      slotDurationMinutes: service.slotDurationMinutes,
      bufferMinutes: service.bufferMinutes,
    };
  }

  const SLOT_INTERVAL_MINUTES = 30;
  const slots = [];
  const now = new Date();
  const isToday = dateStr === now.toISOString().slice(0, 10);

  for (let hour = 6; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_INTERVAL_MINUTES) {
      const slotStart = new Date(`${dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`);
      const slotEnd = new Date(slotStart.getTime() + (service.slotDurationMinutes || 60) * 60_000);

      if (isToday && slotStart <= now) continue;

      const overlappingBookings = activeBookings.filter((b) => {
        const bStart = new Date(b.bookingAt);
        const bEnd = new Date(bStart.getTime() + (service.slotDurationMinutes || 60) * 60_000);
        return bStart < slotEnd && bEnd > slotStart;
      });

      const usedQty = overlappingBookings.reduce((sum, b) => sum + b.quantity, 0);
      const available = usedQty < cap;

      slots.push({
        time: slotStart.toISOString(),
        available,
        remaining: Math.max(0, cap - usedQty),
        capacity: cap,
      });
    }
  }

  return {
    date: dateStr,
    serviceId,
    available: slots.some((s) => s.available),
    bookingModel: "capacity",
    slots,
  };
}
