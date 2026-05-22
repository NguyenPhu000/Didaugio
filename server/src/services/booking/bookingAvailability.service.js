import { BOOKING_STATUS } from "../../config/constants.js";
import {
  endOfMinuteUtc,
  startOfMinuteUtc,
} from "../../utils/bookingTimeSlot.js";

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
 * @param {import("@prisma/client").Prisma.TransactionClient} tx
 * @param {{ serviceId: number; bookingAt: Date; quantity: number; excludeBookingId?: number }} payload
 */
export async function checkAvailability(tx, payload) {
  const { serviceId, bookingAt, quantity, excludeBookingId } = payload;
  const svc = await tx.businessService.findUnique({
    where: { id: serviceId },
    select: { id: true, maxCapacity: true, businessId: true },
  });
  if (!svc) {
    return { ok: false, used: 0, capacity: 0, reason: "NO_SERVICE" };
  }

  // Check blocked dates
  const bookingDate = new Date(bookingAt);
  bookingDate.setUTCHours(0, 0, 0, 0);
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
      bookingAt: { gte: start, lt: end },
    },
    _sum: { quantity: true },
  });

  const used = agg._sum.quantity || 0;
  return {
    ok: used + quantity <= cap,
    used,
    capacity: cap,
  };
}
