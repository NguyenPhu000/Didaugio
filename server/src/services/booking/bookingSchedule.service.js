import prisma from "../../config/prismaClient.js";
import { BOOKING_STATUS } from "../../config/constants.js";
import { ERROR_CODES } from "../../config/messages.js";
import logger from "../../config/logger.js";
import ServiceError from "../../utils/serviceError.js";
import eventEmitter, { EVENTS } from "../../utils/eventEmitter.js";
import {
  combineUseDateAndTime,
  deriveTimeSlot,
  startOfMinuteUtc,
  toUseDateOnly,
  toUseTimeString,
  TIME_SLOT_KEYS,
} from "../../utils/bookingTimeSlot.js";
import {
  appendBookingActionLog,
  BOOKING_ACTION,
} from "./bookingActionLog.service.js";
import {
  checkAvailability,
  lockBookingRow,
} from "./bookingAvailability.service.js";
import { expirePendingBookings, getById } from "./booking.service.js";
import { autoApproveConditionsSchema } from "../../models/index.js";
import {
  assertBookingTransition,
  BOOKING_TRANSITION,
} from "./bookingStateMachine.js";

const scheduleInclude = {
  service: {
    select: {
      id: true,
      name: true,
      maxCapacity: true,
      place: { select: { id: true, name: true } },
    },
  },
  user: {
    select: {
      id: true,
      email: true,
      profile: { select: { fullName: true, phone: true } },
    },
  },
};

function resolveBookingAt(booking) {
  if (booking.bookingAt) return new Date(booking.bookingAt);
  return combineUseDateAndTime(booking.useDate, booking.useTime);
}

function parseYmd(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd).trim());
  if (!m) {
    throw new ServiceError(
      "Tham số date phải là YYYY-MM-DD",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0, 0));
}

function matchRuleConditions(conditions, booking) {
  const hasSlotFilter = conditions.timeSlots?.length > 0;
  const hasQty =
    conditions.minQuantity != null || conditions.maxQuantity != null;
  if (!hasSlotFilter && !hasQty) return false;

  const at = resolveBookingAt(booking);
  const slot = deriveTimeSlot(at);
  if (conditions.timeSlots?.length) {
    if (!conditions.timeSlots.includes(slot)) return false;
  }
  if (
    conditions.minQuantity != null &&
    booking.quantity < conditions.minQuantity
  ) {
    return false;
  }
  if (
    conditions.maxQuantity != null &&
    booking.quantity > conditions.maxQuantity
  ) {
    return false;
  }
  return true;
}

/**
 * Lịch theo ngày: nhóm 4 khung giờ + cờ overbooking.
 */
export async function getScheduleByDate(businessId, dateStr) {
  await expirePendingBookings();

  const useDate = parseYmd(dateStr);

  const rows = await prisma.booking.findMany({
    where: {
      businessId,
      useDate,
      deletedAt: null,
    },
    include: scheduleInclude,
    orderBy: [{ bookingAt: "asc" }, { id: "asc" }],
  });

  const slotBuckets = {
    [TIME_SLOT_KEYS.MORNING]: [],
    [TIME_SLOT_KEYS.NOON]: [],
    [TIME_SLOT_KEYS.AFTERNOON]: [],
    [TIME_SLOT_KEYS.EVENING]: [],
  };

  /** @type {Map<string, { serviceId: number; capacity: number; used: number; bookingIds: number[] }>} */
  const capacityMap = new Map();

  for (const b of rows) {
    const at = resolveBookingAt(b);
    const slot = deriveTimeSlot(at);
    const key = `${b.serviceId}:${startOfMinuteUtc(at).getTime()}`;
    if (!capacityMap.has(key)) {
      capacityMap.set(key, {
        serviceId: b.serviceId,
        capacity: b.service?.maxCapacity ?? 999_999,
        used: 0,
        bookingIds: [],
      });
    }
    const g = capacityMap.get(key);
    g.used += b.quantity;
    g.bookingIds.push(b.id);
  }

  const overbookingIds = new Set();
  for (const g of capacityMap.values()) {
    if (g.used > g.capacity) {
      g.bookingIds.forEach((id) => overbookingIds.add(id));
    }
  }

  for (const b of rows) {
    const at = resolveBookingAt(b);
    const slot = deriveTimeSlot(at);
    const item = {
      ...b,
      timeSlot: slot,
      overbooking: overbookingIds.has(b.id),
    };
    slotBuckets[slot]?.push(item);
  }

  return {
    date: dateStr,
    businessId,
    slots: slotBuckets,
    overbookingIds: [...overbookingIds],
  };
}

export async function rescheduleBooking(
  bookingId,
  bookingTimeIso,
  actorUserId,
  businessNote = undefined,
) {
  await expirePendingBookings();

  const newAt = new Date(bookingTimeIso);
  if (Number.isNaN(newAt.getTime())) {
    throw new ServiceError(
      "bookingTime không hợp lệ",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  await prisma.$transaction(async (tx) => {
    await lockBookingRow(tx, bookingId);
    const existing = await tx.booking.findUnique({
      where: { id: parseInt(bookingId, 10) },
      include: { service: true },
    });
    if (!existing) {
      throw new ServiceError(
        "Booking không tồn tại",
        404,
        ERROR_CODES.NOT_FOUND,
      );
    }
    assertBookingTransition(
      existing.status,
      BOOKING_TRANSITION.RESCHEDULE,
      "Chỉ có thể đổi lịch booking đang chờ hoặc đã xác nhận",
    );

    const avail = await checkAvailability(tx, {
      serviceId: existing.serviceId,
      bookingAt: newAt,
      quantity: existing.quantity,
      excludeBookingId: existing.id,
    });
    if (!avail.ok) {
      throw new ServiceError(
        "Khung giờ đã đủ slot (trùng lịch)",
        409,
        ERROR_CODES.CONFLICT,
      );
    }

    const useDate = toUseDateOnly(newAt);
    const useTime = toUseTimeString(newAt);

    await tx.booking.update({
      where: { id: existing.id },
      data: {
        bookingAt: newAt,
        useDate,
        useTime,
        ...(businessNote !== undefined && { businessNote }),
      },
    });

    await appendBookingActionLog(tx, {
      bookingId: existing.id,
      action: BOOKING_ACTION.RESCHEDULE,
      actorUserId,
      metadata: {
        newBookingAt: newAt.toISOString(),
        businessNote: businessNote || null,
      },
    });
  });

  logger.info("Booking rescheduled", { bookingId, bookingTimeIso });
  return getById(bookingId);
}

export async function quickApproveBooking(bookingId, actorUserId) {
  await expirePendingBookings();

  await prisma.$transaction(async (tx) => {
    await lockBookingRow(tx, bookingId);
    const existing = await tx.booking.findUnique({
      where: { id: parseInt(bookingId, 10) },
      include: { service: true },
    });
    if (!existing) {
      throw new ServiceError(
        "Booking không tồn tại",
        404,
        ERROR_CODES.NOT_FOUND,
      );
    }
    assertBookingTransition(
      existing.status,
      BOOKING_TRANSITION.REQUEST_CONFIRM,
      "Chỉ có thể duyệt nhanh booking đang chờ xác nhận",
    );

    const at = resolveBookingAt(existing);
    const avail = await checkAvailability(tx, {
      serviceId: existing.serviceId,
      bookingAt: at,
      quantity: existing.quantity,
      excludeBookingId: existing.id,
    });
    if (!avail.ok) {
      throw new ServiceError(
        "Không đủ slot trong khung giờ này",
        409,
        ERROR_CODES.CONFLICT,
      );
    }

    await tx.booking.update({
      where: { id: existing.id },
      data: {
        status: BOOKING_STATUS.CONFIRMED,
        confirmedAt: new Date(),
      },
    });

    await appendBookingActionLog(tx, {
      bookingId: existing.id,
      action: BOOKING_ACTION.QUICK_APPROVE,
      actorUserId,
    });
  });

  const booking = await getById(bookingId);
  eventEmitter.emit(EVENTS.BOOKING.CONFIRMED, {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    confirmedBy: actorUserId,
    userId: booking.userId,
  });

  return booking;
}

export async function quickRejectBooking(
  bookingId,
  cancelReason,
  actorUserId,
  businessNote = undefined,
) {
  await expirePendingBookings();

  await prisma.$transaction(async (tx) => {
    await lockBookingRow(tx, bookingId);
    const existing = await tx.booking.findUnique({
      where: { id: parseInt(bookingId, 10) },
    });
    if (!existing) {
      throw new ServiceError(
        "Booking không tồn tại",
        404,
        ERROR_CODES.NOT_FOUND,
      );
    }
    assertBookingTransition(
      existing.status,
      BOOKING_TRANSITION.REQUEST_REJECT,
      "Chỉ có thể từ chối nhanh booking đang chờ xác nhận",
    );

    await tx.booking.update({
      where: { id: existing.id },
      data: {
        status: BOOKING_STATUS.REJECTED,
        cancelReason: cancelReason || "Từ chối nhanh",
        cancelledBy: String(actorUserId),
        cancelledAt: new Date(),
        ...(businessNote !== undefined && { businessNote }),
      },
    });

    await appendBookingActionLog(tx, {
      bookingId: existing.id,
      action: BOOKING_ACTION.QUICK_REJECT,
      actorUserId,
      metadata: {
        cancelReason: cancelReason || null,
        businessNote: businessNote || null,
      },
    });
  });

  const booking = await getById(bookingId);
  eventEmitter.emit(EVENTS.BOOKING.REJECTED, {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    rejectedBy: actorUserId,
    rejectReason: booking.cancelReason,
    userId: booking.userId,
  });

  return booking;
}

/**
 * Quét rule theo priority; nếu không đủ slot thì giữ PENDING và ghi log auto_approve_failed.
 */
export async function autoApproveIfMatchRules(bookingId) {
  return prisma.$transaction(async (tx) => {
    await lockBookingRow(tx, bookingId);
    const booking = await tx.booking.findUnique({
      where: { id: parseInt(bookingId, 10) },
      include: { service: true },
    });
    if (!booking) {
      throw new ServiceError(
        "Booking không tồn tại",
        404,
        ERROR_CODES.NOT_FOUND,
      );
    }
    if (booking.status !== BOOKING_STATUS.PENDING) {
      return { applied: false, reason: "NOT_PENDING" };
    }

    const rules = await tx.autoApproveRule.findMany({
      where: {
        businessId: booking.businessId,
        isActive: true,
        isDeleted: false,
      },
      orderBy: { priority: "desc" },
    });

    for (const rule of rules) {
      const parsed = autoApproveConditionsSchema.safeParse(rule.conditions);
      if (!parsed.success) continue;
      if (!matchRuleConditions(parsed.data, booking)) continue;

      const at = resolveBookingAt(booking);
      const avail = await checkAvailability(tx, {
        serviceId: booking.serviceId,
        bookingAt: at,
        quantity: booking.quantity,
        excludeBookingId: booking.id,
      });

      if (!avail.ok) {
        await appendBookingActionLog(tx, {
          bookingId: booking.id,
          action: BOOKING_ACTION.AUTO_APPROVE_FAILED,
          actorUserId: null,
          metadata: {
            ruleId: rule.id,
            reason: "CAPACITY",
            used: avail.used,
            capacity: avail.capacity,
          },
        });
        return { applied: false, reason: "CAPACITY", ruleId: rule.id };
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BOOKING_STATUS.CONFIRMED,
          confirmedAt: new Date(),
        },
      });

      await appendBookingActionLog(tx, {
        bookingId: booking.id,
        action: BOOKING_ACTION.AUTO_APPROVE,
        actorUserId: null,
        metadata: { ruleId: rule.id },
      });

      return { applied: true, ruleId: rule.id };
    }

    return { applied: false, reason: "NO_RULE_MATCH" };
  });
}
