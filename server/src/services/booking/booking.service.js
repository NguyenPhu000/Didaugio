import crypto from "node:crypto";
import prisma from "../../config/prismaClient.js";
import logger from "../../config/logger.js";
import {
  PAGINATION,
  ROLES,
  BOOKING_STATUS,
  PAYMENT_STATUS,
} from "../../config/constants.js";
import { ERROR_CODES } from "../../config/messages.js";
import eventEmitter, { EVENTS } from "../../utils/eventEmitter.js";
import {
  buildBookingQRPayload,
  generateBookingQR,
} from "../../utils/generateQR.js";
import ServiceError from "../../utils/serviceError.js";
import { assertBusinessLimit } from "../subscription/subscriptionEntitlement.service.js";
import { combineUseDateAndTime } from "../../utils/bookingTimeSlot.js";
import {
  checkAvailability,
  lockBookingRow,
} from "./bookingAvailability.service.js";
import {
  appendBookingActionLog,
  BOOKING_ACTION,
} from "./bookingActionLog.service.js";
import { toUseDateOnly, toUseTimeString } from "../../utils/bookingTimeSlot.js";
import {
  assertBookingTransition,
  BOOKING_TRANSITION,
} from "./bookingStateMachine.js";
import {
  validateAndApplyVoucher,
  incrementVoucherUsage,
} from "../voucher/index.js";
import {
  isUniqueConstraintOnIdempotencyKey,
  normalizeBookingIdempotencyKey,
} from "./bookingIdempotency.service.js";
import { createBookingTransaction } from "./bookingTransaction.service.js";
import {
  settleCompletedLedger,
  refundLedger,
} from "./financialCore.service.js";

let expirePendingBookingsEnumWarned = false;

function isBookingStatusEnumMismatchError(error) {
  const msg = String(error?.message || "");
  return (
    msg.includes("invalid input value for enum") &&
    (msg.includes("BookingStatus") || msg.includes("booking_status"))
  );
}

const defaultInclude = {
  service: {
    select: {
      id: true,
      name: true,
      price: true,
      maxCapacity: true,
      durationMinutes: true,
      bookingModel: true,
      slotDurationMinutes: true,
      allowOverbooking: true,
      businessId: true,
      business: {
        select: {
          id: true,
          businessName: true,
          status: true,
          commissionRate: true,
        },
      },
      place: { select: { id: true, name: true, address: true } },
    },
  },
  user: {
    select: {
      id: true,
      email: true,
      profile: {
        select: {
          fullName: true,
          phone: true,
        },
      },
    },
  },
  resource: {
    select: {
      id: true,
      name: true,
      code: true,
      resourceType: true,
      capacity: true,
    },
  },
};

export const serializeBookingUser = (booking) => {
  if (!booking?.user) return booking;

  const { user, ...rest } = booking;

  return {
    ...rest,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.profile?.fullName || null,
      phone: user.profile?.phone || null,
    },
  };
};

const generateBookingCode = () => {
  const prefix = "BK";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(5).toString("hex").toUpperCase().slice(0, 10);
  return `${prefix}-${timestamp}-${random}`;
};

const QR_CREATED_WINDOW_MS = 2 * 60 * 60 * 1000;
const DEFAULT_QR_GRACE_MINUTES = 30;
const DEFAULT_PENDING_EXPIRY_GRACE_MINUTES = 0;
const EXPIRE_PENDING_BATCH_SIZE = 100;
const BOOKING_TRIP_NOTE_PREFIX = "[BOOKING_LINK]";

// TODO(phase-next): move service deposit policy out of `terms` JSON into Prisma columns.

const parseTermsObject = (terms) => {
  if (!terms || typeof terms !== "string") return null;
  try {
    const parsed = JSON.parse(terms);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
};

const getDepositConfig = (service) => {
  const terms = parseTermsObject(service?.terms);
  const policy = terms?.depositConfig || {};

  const requireDeposit =
    policy.requireDeposit === true || String(policy.requireDeposit) === "true";
  const depositType = policy.depositType === "FIXED" ? "FIXED" : "PERCENT";
  const depositAmount = Number(policy.depositAmount);
  const depositRefundPercent = Number(policy.depositRefundPercent);

  return {
    requireDeposit,
    depositType: requireDeposit ? depositType : null,
    depositAmount:
      requireDeposit && Number.isFinite(depositAmount) && depositAmount > 0
        ? depositAmount
        : null,
    depositRefundable: policy.depositRefundable !== false,
    depositRefundPercent:
      Number.isFinite(depositRefundPercent) && depositRefundPercent >= 0
        ? Math.min(depositRefundPercent, 100)
        : 50,
  };
};

const normalizeGraceMinutes = (value, fallback = DEFAULT_QR_GRACE_MINUTES) => {
  const num = parseInt(value, 10);
  if (num === 20 || num === 30) return num;
  return fallback;
};

const resolveQrGraceMinutes = (serviceTerms) => {
  const envDefault = normalizeGraceMinutes(
    process.env.BOOKING_QR_GRACE_MINUTES,
    DEFAULT_QR_GRACE_MINUTES,
  );

  const terms = parseTermsObject(serviceTerms);
  if (!terms) return envDefault;

  const direct = normalizeGraceMinutes(terms.qrGraceMinutes, NaN);
  if (!Number.isNaN(direct)) return direct;

  const nested = normalizeGraceMinutes(terms?.booking?.qrGraceMinutes, NaN);
  if (!Number.isNaN(nested)) return nested;

  return envDefault;
};

const deriveBookingAtFromEntity = (booking) => {
  if (booking?.bookingAt) {
    const fromBookingAt = new Date(booking.bookingAt);
    if (!Number.isNaN(fromBookingAt.getTime())) {
      return fromBookingAt;
    }
  }

  if (booking?.useDate) {
    const combined = combineUseDateAndTime(booking.useDate, booking.useTime);
    if (!Number.isNaN(combined.getTime())) {
      return combined;
    }
  }

  return null;
};

const computeQrExpiryAt = (booking, graceMinutes) => {
  const createdAt = new Date(booking.createdAt);
  if (Number.isNaN(createdAt.getTime())) return null;

  const byCreateTime = new Date(createdAt.getTime() + QR_CREATED_WINDOW_MS);
  const bookingAt = deriveBookingAtFromEntity(booking);

  if (!bookingAt) return byCreateTime;

  const byBookingTime = new Date(bookingAt.getTime() - graceMinutes * 60_000);
  return byCreateTime.getTime() <= byBookingTime.getTime()
    ? byCreateTime
    : byBookingTime;
};

const toUtcDateOnly = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      12,
      0,
      0,
      0,
    ),
  );
};

const resolvePendingExpiryGraceMinutes = () => {
  const minutes = parseInt(
    process.env.BOOKING_PENDING_EXPIRY_GRACE_MINUTES,
    10,
  );
  if (Number.isFinite(minutes) && minutes >= 0) return minutes;
  return DEFAULT_PENDING_EXPIRY_GRACE_MINUTES;
};

const resolvePendingExpiryCutoff = (referenceDate = new Date()) => {
  const base =
    referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const safeBase = Number.isNaN(base.getTime()) ? new Date() : base;
  return new Date(
    safeBase.getTime() - resolvePendingExpiryGraceMinutes() * 60_000,
  );
};

const buildExpiredPendingWhere = (cutoff) => ({
  status: BOOKING_STATUS.PENDING,
  deletedAt: null,
  payment: {
    status: {
      notIn: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.FULLY_REFUNDED],
    },
  },
  OR: [
    { bookingAt: { lt: cutoff } },
    {
      bookingAt: null,
      useDate: { lt: toUtcDateOnly(cutoff) || cutoff },
    },
  ],
});

export const expirePendingBookings = async ({
  referenceDate = new Date(),
  limit = EXPIRE_PENDING_BATCH_SIZE,
  db = prisma,
} = {}) => {
  const cutoff = resolvePendingExpiryCutoff(referenceDate);
  const take = Math.min(
    Math.max(parseInt(limit, 10) || EXPIRE_PENDING_BATCH_SIZE, 1),
    EXPIRE_PENDING_BATCH_SIZE,
  );

  try {
    const expireInTransaction = async (tx) => {
      const candidates = await tx.booking.findMany({
        where: buildExpiredPendingWhere(cutoff),
        select: {
          id: true,
          bookingCode: true,
          userId: true,
          bookingAt: true,
          useDate: true,
          useTime: true,
        },
        take,
        orderBy: [{ bookingAt: "asc" }, { id: "asc" }],
      });

      if (candidates.length === 0) return [];

      const expiredAt = new Date();
      await tx.booking.updateMany({
        where: {
          id: { in: candidates.map((booking) => booking.id) },
          status: BOOKING_STATUS.PENDING,
        },
        data: {
          status: BOOKING_STATUS.EXPIRED,
          cancelReason: "Yêu cầu đặt chỗ đã quá thời hạn xử lý",
          cancelledBy: "system",
          cancelledAt: expiredAt,
        },
      });

      await Promise.all(
        candidates.map((booking) =>
          appendBookingActionLog(tx, {
            bookingId: booking.id,
            action: BOOKING_ACTION.AUTO_EXPIRE,
            actorUserId: null,
            metadata: {
              cutoff: cutoff.toISOString(),
              bookingAt: booking.bookingAt?.toISOString?.() || null,
              useDate: booking.useDate?.toISOString?.() || null,
              useTime: booking.useTime || null,
            },
          }),
        ),
      );

      return candidates;
    };

    const expiredBookings =
      typeof db.$transaction === "function"
        ? await db.$transaction(expireInTransaction)
        : await expireInTransaction(db);

    expiredBookings.forEach((booking) => {
      eventEmitter.emit(EVENTS.BOOKING.EXPIRED, {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        userId: booking.userId,
      });
    });

    return { count: expiredBookings.length, bookings: expiredBookings };
  } catch (error) {
    if (isBookingStatusEnumMismatchError(error)) {
      if (!expirePendingBookingsEnumWarned) {
        expirePendingBookingsEnumWarned = true;
        logger.warn(
          "expirePendingBookings skipped: PostgreSQL enum BookingStatus is missing rejected/expired. Run: cd server && npm run migrate:dev (or prisma migrate deploy).",
        );
      }
      return { count: 0, bookings: [] };
    }
    throw error;
  }
};

const computeTripDayNumber = (tripStartDate, bookingUseDate, fallbackDate) => {
  const bookingDateOnly = toUtcDateOnly(bookingUseDate || fallbackDate);
  if (!bookingDateOnly) return 1;

  const startDateOnly = toUtcDateOnly(tripStartDate);
  if (!startDateOnly) return 1;

  const diffDays = Math.floor(
    (bookingDateOnly.getTime() - startDateOnly.getTime()) /
      (24 * 60 * 60 * 1000),
  );

  return Math.max(diffDays + 1, 1);
};

const buildBookingTripNote = (bookingCode, useTime) => {
  const safeTime = useTime ? ` • ${useTime}` : "";
  return `${BOOKING_TRIP_NOTE_PREFIX} ${bookingCode}${safeTime}`;
};

const findLinkedTripByBookingCode = (destinations = [], bookingCode) => {
  return destinations.find((dest) =>
    String(dest?.note || "").includes(String(bookingCode || "").trim()),
  );
};

const attachLinkedTripForBookings = async (bookings = [], userId) => {
  if (!Array.isArray(bookings) || bookings.length === 0) return [];

  const placeIds = Array.from(
    new Set(
      bookings
        .map((item) => Number(item?.service?.place?.id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  );

  if (placeIds.length === 0) {
    return bookings.map((booking) => ({ ...booking, linkedTrip: null }));
  }

  const linkedDestinations = await prisma.tripDestination.findMany({
    where: {
      placeId: { in: placeIds },
      note: { contains: BOOKING_TRIP_NOTE_PREFIX },
      trip: { userId: parseInt(userId, 10) },
    },
    include: {
      trip: {
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
          totalDays: true,
          status: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return bookings.map((booking) => {
    const matched = findLinkedTripByBookingCode(
      linkedDestinations,
      booking?.bookingCode,
    );

    if (!matched?.trip) {
      return { ...booking, linkedTrip: null };
    }

    return {
      ...booking,
      linkedTrip: {
        id: matched.trip.id,
        title: matched.trip.title,
        status: matched.trip.status,
        startDate: matched.trip.startDate,
        endDate: matched.trip.endDate,
        totalDays: matched.trip.totalDays,
        dayNumber: matched.dayNumber,
        destinationId: matched.id,
      },
    };
  });
};

const linkBookingIntoTripTx = async (
  tx,
  { tripId, userId, bookingCode, placeId, useDate, useTime, bookingCreatedAt },
) => {
  const parsedTripId = parseInt(tripId, 10);
  if (!parsedTripId) {
    throw new ServiceError(
      "tripId không hợp lệ",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const trip = await tx.trip.findFirst({
    where: {
      id: parsedTripId,
      userId: parseInt(userId, 10),
    },
    select: {
      id: true,
      title: true,
      status: true,
      startDate: true,
      endDate: true,
      totalDays: true,
    },
  });

  if (!trip) {
    throw new ServiceError(
      "Không tìm thấy trip để liên kết booking",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  const bookingDate = toUtcDateOnly(useDate || bookingCreatedAt) || new Date();
  const dayNumber = computeTripDayNumber(
    trip.startDate,
    bookingDate,
    bookingDate,
  );

  const tripUpdateData = {};
  const currentTotalDays = Math.max(parseInt(trip.totalDays, 10) || 1, 1);
  const tripStartDate = toUtcDateOnly(trip.startDate);

  if (tripStartDate && bookingDate.getTime() < tripStartDate.getTime()) {
    tripUpdateData.startDate = bookingDate;
  }

  if (dayNumber > currentTotalDays) {
    tripUpdateData.totalDays = dayNumber;
  }

  if (!trip.startDate) {
    tripUpdateData.startDate = bookingDate;
  }

  if (
    !trip.endDate ||
    toUtcDateOnly(trip.endDate)?.getTime() < bookingDate.getTime()
  ) {
    tripUpdateData.endDate = bookingDate;
  }

  if (Object.keys(tripUpdateData).length > 0) {
    await tx.trip.update({
      where: { id: trip.id },
      data: tripUpdateData,
    });
  }

  await tx.tripDestination.deleteMany({
    where: {
      note: { contains: String(bookingCode) },
      trip: { userId: parseInt(userId, 10) },
    },
  });

  const maxOrder = await tx.tripDestination.aggregate({
    where: { tripId: trip.id, dayNumber },
    _max: { order: true },
  });

  const destination = await tx.tripDestination.create({
    data: {
      tripId: trip.id,
      placeId: parseInt(placeId, 10),
      dayNumber,
      order: (maxOrder?._max?.order || 0) + 1,
      startTime: useTime || null,
      note: buildBookingTripNote(bookingCode, useTime),
      status: "planned",
    },
    select: {
      id: true,
      dayNumber: true,
    },
  });

  return {
    id: trip.id,
    title: trip.title,
    status: trip.status,
    dayNumber: destination.dayNumber,
    destinationId: destination.id,
  };
};

export const getAll = async (params = {}, userId, roleId) => {
  await expirePendingBookings();

  const page = parseInt(params.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(params.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );
  const skip = (page - 1) * limit;

  const where = {};

  if (roleId > ROLES.ADMIN) {
    const business = await prisma.business.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });
    if (!business)
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    where.service = { businessId: business.id };
  }

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }
  if (params.placeId) {
    where.service = {
      ...(where.service || {}),
      placeId: parseInt(params.placeId),
    };
  }
  if (params.businessId) {
    where.businessId = parseInt(params.businessId);
  }
  if (params.search) {
    where.OR = [
      { bookingCode: { contains: params.search, mode: "insensitive" } },
      { guestName: { contains: params.search, mode: "insensitive" } },
      { guestPhone: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.fromDate) {
    const fromDate = new Date(params.fromDate);
    fromDate.setUTCHours(0, 0, 0, 0);
    where.useDate = {
      ...where.useDate,
      gte: fromDate,
    };
  }
  if (params.toDate) {
    const toDate = new Date(params.toDate);
    toDate.setUTCHours(23, 59, 59, 999);
    where.useDate = { ...where.useDate, lte: toDate };
  }

  const orderBy =
    params.sortBy === "oldest"
      ? { createdAt: "asc" }
      : ["booking_date", "use_date"].includes(params.sortBy)
        ? [{ useDate: "desc" }, { createdAt: "desc" }]
        : { createdAt: "desc" };

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: defaultInclude,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    data: data.map(serializeBookingUser),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getMyBookings = async (userId, params = {}) => {
  await expirePendingBookings();

  const page = parseInt(params.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(params.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );
  const skip = (page - 1) * limit;

  const where = {
    userId: parseInt(userId, 10),
  };

  if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: defaultInclude,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.count({ where }),
  ]);

  const enriched = await attachLinkedTripForBookings(data, userId);

  return {
    data: enriched.map(serializeBookingUser),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getMyBookingDetail = async (bookingId, userId) => {
  await expirePendingBookings();

  const booking = await prisma.booking.findFirst({
    where: {
      id: parseInt(bookingId, 10),
      userId: parseInt(userId, 10),
    },
    include: {
      ...defaultInclude,
      payment: {
        select: {
          id: true,
          amount: true,
          paymentMethod: true,
          transactionRef: true,
          status: true,
          paidAt: true,
          refundAmount: true,
          refundedAt: true,
          refundReason: true,
        },
      },
    },
  });

  if (!booking) {
    throw new ServiceError("Booking không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

  const [enriched] = await attachLinkedTripForBookings([booking], userId);
  return serializeBookingUser(enriched || booking);
};

export const getMyBookingQR = async (bookingId, userId) => {
  const baseUrl =
    process.env.APP_URL || process.env.WEB_URL || "https://didaugio.vn";

  const booking = await prisma.booking.findFirst({
    where: {
      id: parseInt(bookingId, 10),
      userId: parseInt(userId, 10),
    },
    select: {
      id: true,
      bookingCode: true,
      status: true,
    },
  });

  if (!booking) {
    throw new ServiceError("Booking không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw new ServiceError(
      "Booking chưa được xác nhận để lấy QR",
      422,
      ERROR_CODES.BOOKING_NOT_CONFIRMED,
    );
  }

  const qrAction = "checkin";
  const qrPayload = buildBookingQRPayload(booking.bookingCode, qrAction);
  const qrCode = await generateBookingQR(booking.bookingCode, baseUrl, qrAction);
  return { bookingCode: booking.bookingCode, qrAction, qrPayload, qrCode };
};

export const linkMyBookingToTrip = async (bookingId, userId, payload = {}) => {
  const parsedBookingId = parseInt(bookingId, 10);
  const parsedTripId = parseInt(payload.tripId, 10);

  if (!parsedBookingId || !parsedTripId) {
    throw new ServiceError(
      "bookingId hoặc tripId không hợp lệ",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id: parsedBookingId,
      userId: parseInt(userId, 10),
    },
    select: {
      id: true,
      bookingCode: true,
      useDate: true,
      useTime: true,
      createdAt: true,
      service: { select: { placeId: true } },
    },
  });

  if (!booking) {
    throw new ServiceError("Booking không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

  const linkedTrip = await prisma.$transaction(async (tx) => {
    return linkBookingIntoTripTx(tx, {
      tripId: parsedTripId,
      userId,
      bookingCode: booking.bookingCode,
      placeId: booking.service.placeId,
      useDate: booking.useDate,
      useTime: booking.useTime,
      bookingCreatedAt: booking.createdAt,
    });
  });

  const updatedBooking = await getMyBookingDetail(parsedBookingId, userId);
  return {
    ...updatedBooking,
    linkedTrip,
  };
};

export const getById = async (id) => {
  await expirePendingBookings();

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(id) },
    include: {
      ...defaultInclude,
      service: {
        include: {
          business: { select: { id: true, businessName: true, ownerId: true } },
        },
      },
      voucher: {
        select: {
          id: true,
          code: true,
          discountType: true,
          discountValue: true,
        },
      },
      payment: {
        select: {
          id: true,
          amount: true,
          paymentMethod: true,
          transactionRef: true,
          status: true,
          paidAt: true,
          refundAmount: true,
          refundedAt: true,
          refundReason: true,
        },
      },
    },
  });

  if (!booking) {
    throw new ServiceError("Booking không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

  return serializeBookingUser(booking);
};

export const getStats = async (userId, roleId) => {
  await expirePendingBookings();

  const where = {};

  if (roleId > ROLES.ADMIN) {
    const business = await prisma.business.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });
    if (!business) return { total: 0, byStatus: {} };
    where.service = { businessId: business.id };
  }

  const [total, byStatus] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
    }),
  ]);

  return {
    total,
    byStatus: byStatus.reduce(
      (acc, item) => ({ ...acc, [item.status]: item._count.id }),
      {},
    ),
  };
};

/**
 * User-facing booking creation.
 * NOTE: Deposit persistence is transitional via service terms metadata until Prisma migration phase.
 */
export const create = async (payload = {}, userId) => {
  if (!userId) {
    throw new ServiceError(
      "Thiếu thông tin người dùng",
      401,
      ERROR_CODES.UNAUTHORIZED,
    );
  }

  const serviceId = parseInt(payload.serviceId, 10);
  if (!serviceId) {
    throw new ServiceError(
      "serviceId không hợp lệ",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const quantity = Math.max(parseInt(payload.quantity, 10) || 1, 1);
  const idempotencyKey = normalizeBookingIdempotencyKey(payload.idempotencyKey);
  const requestedPlaceId = payload.placeId
    ? parseInt(payload.placeId, 10)
    : null;
  const requestedTripId =
    payload.tripId !== undefined &&
    payload.tripId !== null &&
    payload.tripId !== ""
      ? parseInt(payload.tripId, 10)
      : null;

  if (payload.tripId !== undefined && requestedTripId === null) {
    throw new ServiceError(
      "tripId không hợp lệ",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  if (
    requestedTripId !== null &&
    (!Number.isInteger(requestedTripId) || requestedTripId <= 0)
  ) {
    throw new ServiceError(
      "tripId không hợp lệ",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const [user, service] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    }),
    prisma.businessService.findUnique({
      where: { id: serviceId },
      include: {
        place: {
          select: {
            id: true,
            name: true,
            status: true,
            businessId: true,
          },
        },
        business: {
          select: { id: true, ownerId: true, status: true },
        },
      },
    }),
  ]);

  if (!user) {
    throw new ServiceError(
      "Người dùng không tồn tại",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  if (!service || !service.isActive) {
    throw new ServiceError(
      "Dịch vụ không tồn tại hoặc đã ngừng hoạt động",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  if (requestedPlaceId && service.placeId !== requestedPlaceId) {
    throw new ServiceError(
      "Dịch vụ không thuộc địa điểm đã chọn",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  if (service.place?.status !== "approved") {
    throw new ServiceError(
      "Địa điểm chưa sẵn sàng nhận booking",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  if (service.business?.status && service.business.status !== "approved") {
    throw new ServiceError(
      "Doanh nghiệp chưa sẵn sàng nhận booking",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  let bookingAt = null;
  if (payload.bookingAt) {
    bookingAt = new Date(payload.bookingAt);
  } else if (payload.useDate) {
    const dateOnly = new Date(payload.useDate);
    if (!Number.isNaN(dateOnly.getTime())) {
      bookingAt = combineUseDateAndTime(dateOnly, payload.useTime || "09:00");
    }
  }
  if (!bookingAt || Number.isNaN(bookingAt.getTime())) {
    bookingAt = new Date();
  }

  // Validate booking time is in the future (allow 5-minute grace for clock skew)
  const now = new Date();
  const graceMs = 5 * 60 * 1000;
  if (bookingAt.getTime() < now.getTime() - graceMs) {
    throw new ServiceError(
      "Thời gian đặt chỗ phải ở tương lai",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const unitPrice = service.salePrice ?? service.price;
  const originalPrice = unitPrice * quantity;
  let discountAmount = 0;
  let voucherId = null;
  const useDate = toUseDateOnly(bookingAt);
  const useTime = payload.useTime || toUseTimeString(bookingAt);

  // Tính startTime/endTime cho RESOURCE model
  const startTime = service.bookingModel === "resource" ? bookingAt : null;
  const endTime =
    startTime && service.durationMinutes
      ? new Date(bookingAt.getTime() + service.durationMinutes * 60_000)
      : null;

  const guestName =
    payload.guestName || user.profile?.fullName || user.email || "Khách";
  const guestPhone = payload.guestPhone || user.profile?.phone || "0000000000";
  const guestEmail = payload.guestEmail || user.email || null;

  const depositPolicy = getDepositConfig(service);

  if (idempotencyKey) {
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId,
        idempotencyKey,
      },
      include: defaultInclude,
    });

    if (existingBooking) {
      return serializeBookingUser(existingBooking);
    }
  }

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const currentMonthBookings = await prisma.booking.count({
    where: {
      businessId: service.businessId,
      status: { in: ["pending", "confirmed", "completed"] },
      createdAt: { gte: startOfMonth, lt: startOfNextMonth },
    },
  });
  await assertBusinessLimit(
    service.businessId,
    "maxBookings",
    currentMonthBookings,
  );

  let bookingResult;
  try {
    bookingResult = await prisma.$transaction(async (tx) => {
    const avail = await checkAvailability(tx, {
      serviceId,
      bookingAt,
      quantity,
    });

    if (!avail.ok) {
      throw new ServiceError(
        "Khung giờ đã đầy, vui lòng chọn thời gian khác",
        409,
        ERROR_CODES.CONFLICT,
      );
    }

    if (payload.voucherId) {
      try {
        const voucherResult = await validateAndApplyVoucher(tx, {
          voucherId: payload.voucherId,
          serviceId,
          businessId: service.businessId,
          userId,
          originalPrice,
        });
        discountAmount = voucherResult.discountAmount;
        voucherId = voucherResult.voucherId;
      } catch (voucherError) {
        // Voucher validation failed - let the error propagate to inform the user
        throw new ServiceError(
          voucherError.message || "Voucher không hợp lệ hoặc đã hết hạn",
          422,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }
    }

    const finalPrice = originalPrice - discountAmount;

    const booking = await tx.booking.create({
      data: {
        bookingCode: generateBookingCode(),
        userId,
        serviceId: service.id,
        businessId: service.businessId,
        bookingAt,
        quantity,
        useDate,
        useTime,
        startTime,
        endTime,
        guestName,
        guestPhone,
        guestEmail,
        guestNote: payload.note || null,
        originalPrice,
        discountAmount,
        voucherId,
        finalPrice,
        paymentStatus: PAYMENT_STATUS.UNPAID,
        status: BOOKING_STATUS.PENDING,
        idempotencyKey,
      },
      include: defaultInclude,
    });

    if (voucherId) {
      await incrementVoucherUsage(tx, voucherId);
    }

    let linkedTrip = null;
    if (requestedTripId) {
      linkedTrip = await linkBookingIntoTripTx(tx, {
        tripId: requestedTripId,
        userId,
        bookingCode: booking.bookingCode,
        placeId: service.placeId,
        useDate,
        useTime,
        bookingCreatedAt: booking.createdAt,
      });
    }

    return { booking, linkedTrip };
    });
  } catch (error) {
    if (idempotencyKey && isUniqueConstraintOnIdempotencyKey(error)) {
      const existingBooking = await prisma.booking.findFirst({
        where: {
          userId,
          idempotencyKey,
        },
        include: defaultInclude,
      });

      if (existingBooking) {
        return serializeBookingUser(existingBooking);
      }
    }

    throw error;
  }

  const booking = bookingResult.booking;
  const linkedTrip = bookingResult.linkedTrip;

  eventEmitter.emit(EVENTS.BOOKING.CREATED, {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    userId: booking.userId,
    businessOwnerId: service.business?.ownerId,
    requireDeposit: depositPolicy.requireDeposit,
  });

  const result = serializeBookingUser(booking);
  if (linkedTrip) {
    result.linkedTrip = linkedTrip;
  }

  return result;
};

export const confirm = async (bookingId, userId, businessNote = undefined) => {
  await expirePendingBookings();

  const booking = await prisma.$transaction(async (tx) => {
    await lockBookingRow(tx, bookingId);
    const existing = await tx.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: { service: true, user: true },
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
      "Chỉ có thể xác nhận booking đang chờ",
    );

    // Skip availability check for already-paid bookings (slot already taken at payment time)
    const isPaidPending = existing.status === BOOKING_STATUS.PAID_PENDING_CONFIRM;
    if (!isPaidPending) {
      const at = existing.bookingAt
        ? new Date(existing.bookingAt)
        : combineUseDateAndTime(existing.useDate, existing.useTime);

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
    }

    const updated = await tx.booking.update({
      where: { id: parseInt(bookingId) },
      data: {
        status: BOOKING_STATUS.CONFIRMED,
        confirmedAt: new Date(),
        ...(businessNote !== undefined && { businessNote }),
      },
      include: defaultInclude,
    });

    await appendBookingActionLog(tx, {
      bookingId: updated.id,
      action: BOOKING_ACTION.APPROVE,
      actorUserId: userId,
      metadata: { source: "confirm", businessNote: businessNote || null },
    });

    return updated;
  });

  eventEmitter.emit(EVENTS.BOOKING.CONFIRMED, {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    confirmedBy: userId,
    userId: booking.userId,
  });

  return serializeBookingUser(booking);
};

export const cancel = async (bookingId, cancelReason, userId, actorType = "user") => {
  const booking = await prisma.$transaction(async (tx) => {
    await lockBookingRow(tx, bookingId);
    const existing = await tx.booking.findUnique({
      where: { id: parseInt(bookingId) },
    });

    if (!existing) {
      throw new ServiceError(
        "Booking không tồn tại",
        404,
        ERROR_CODES.NOT_FOUND,
      );
    }

    // Use appropriate transition based on who is cancelling
    const transition =
      actorType === "business"
        ? BOOKING_TRANSITION.BUSINESS_CANCEL
        : BOOKING_TRANSITION.USER_CANCEL;

    // BUSINESS_CANCEL only works from CONFIRMED; fall back to USER_CANCEL for PENDING
    const effectiveTransition =
      transition === BOOKING_TRANSITION.BUSINESS_CANCEL &&
      existing.status === BOOKING_STATUS.PENDING
        ? BOOKING_TRANSITION.USER_CANCEL
        : transition;

    assertBookingTransition(
      existing.status,
      effectiveTransition,
      "Chỉ có thể hủy booking đang chờ hoặc đã xác nhận",
    );

    const updated = await tx.booking.update({
      where: { id: parseInt(bookingId) },
      data: {
        status: BOOKING_STATUS.CANCELLED,
        cancelReason,
        cancelledBy: String(userId),
        cancelledAt: new Date(),
      },
      include: defaultInclude,
    });

    // Refund frozen balance if booking was paid
    if (existing.paymentStatus === PAYMENT_STATUS.PAID && existing.businessEarned > 0) {
      await refundLedger(tx, existing.id, existing.businessId, existing.businessEarned, existing.commissionAmount || 0);
    }

    // Decrement voucher usage count if this booking used a voucher
    if (existing.voucherId) {
      const voucher = await tx.voucher.findUnique({
        where: { id: existing.voucherId },
        select: { usageCount: true },
      });
      if (voucher && voucher.usageCount > 0) {
        await tx.voucher.update({
          where: { id: existing.voucherId },
          data: { usageCount: { decrement: 1 } },
        });
      }
    }

    await appendBookingActionLog(tx, {
      bookingId: updated.id,
      action: BOOKING_ACTION.CANCEL,
      actorUserId: userId,
      metadata: { cancelReason },
    });

    return updated;
  });

  eventEmitter.emit(EVENTS.BOOKING.CANCELLED, {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    cancelledBy: userId,
    cancelReason,
    userId: booking.userId,
  });

  return serializeBookingUser(booking);
};

export const cancelMyBooking = async (bookingId, userId, cancelReason) => {
  const normalizedBookingId = parseInt(bookingId, 10);
  const normalizedUserId = parseInt(userId, 10);

  if (Number.isNaN(normalizedBookingId) || normalizedBookingId <= 0) {
    throw new ServiceError(
      "ID booking không hợp lệ",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  if (Number.isNaN(normalizedUserId) || normalizedUserId <= 0) {
    throw new ServiceError(
      "Người dùng không hợp lệ",
      401,
      ERROR_CODES.UNAUTHORIZED,
    );
  }

  const booking = await prisma.$transaction(async (tx) => {
    await lockBookingRow(tx, normalizedBookingId);

    const existing = await tx.booking.findUnique({
      where: { id: normalizedBookingId },
      include: {
        payment: true,
        user: true,
        service: {
          include: {
            place: true,
            business: true,
          },
        },
      },
    });

    if (!existing) {
      throw new ServiceError(
        "Đơn đặt chỗ không tồn tại",
        404,
        ERROR_CODES.NOT_FOUND,
      );
    }

    if (existing.userId !== normalizedUserId) {
      throw new ServiceError(
        "Không có quyền truy cập đơn đặt chỗ này",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    assertBookingTransition(
      existing.status,
      BOOKING_TRANSITION.USER_CANCEL,
      "Đơn đặt chỗ không ở trạng thái có thể hủy",
    );

    const cancelledAt = new Date();

    const updated = await tx.booking.update({
      where: { id: normalizedBookingId },
      data: {
        status: BOOKING_STATUS.CANCELLED,
        cancelReason,
        cancelledBy: String(normalizedUserId),
        cancelledAt,
      },
      include: {
        ...defaultInclude,
        payment: true,
      },
    });

    // Refund frozen balance if booking was paid
    if (existing.paymentStatus === PAYMENT_STATUS.PAID && existing.businessEarned > 0) {
      await refundLedger(tx, existing.id, existing.businessId, existing.businessEarned, existing.commissionAmount || 0);
    }

    if (existing.voucherId) {
      const voucher = await tx.voucher.findUnique({
        where: { id: existing.voucherId },
        select: { usageCount: true },
      });
      if (voucher && voucher.usageCount > 0) {
        await tx.voucher.update({
          where: { id: existing.voucherId },
          data: { usageCount: { decrement: 1 } },
        });
      }
    }

    await appendBookingActionLog(tx, {
      bookingId: updated.id,
      action: BOOKING_ACTION.CANCEL,
      actorUserId: normalizedUserId,
      metadata: {
        cancelReason,
        source: "profile_user_cancel",
        paymentStatus: existing.payment?.status || null,
      },
    });

    return updated;
  });

  eventEmitter.emit(EVENTS.BOOKING.CANCELLED, {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    cancelledBy: normalizedUserId,
    cancelReason,
    userId: booking.userId,
  });

  return serializeBookingUser(booking);
};

export const complete = async (bookingId, userId, businessNote = undefined) => {
  const booking = await prisma.$transaction(async (tx) => {
    await lockBookingRow(tx, bookingId);
    const existing = await tx.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        service: { include: { business: true } },
        user: true,
        payment: true,
      },
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
      BOOKING_TRANSITION.COMPLETE,
      "Chỉ có thể hoàn thành booking đã xác nhận",
    );

    const commissionRate =
      Number(existing.service?.business?.commissionRate) || 10;
    const commissionAmount = Math.floor(
      (existing.finalPrice * commissionRate) / 100,
    );

    // Only mark as paid if there's an actual payment record
    const hasPayment = existing.payment && existing.payment.status === "paid";

    await tx.booking.update({
      where: { id: parseInt(bookingId) },
      data: {
        status: BOOKING_STATUS.COMPLETED,
        completedAt: new Date(),
        commissionAmount,
        ...(hasPayment && { paymentStatus: "paid" }),
        ...(businessNote !== undefined && { businessNote }),
      },
    });

    await createBookingTransaction(tx, {
      bookingId: existing.id,
      businessId: existing.businessId,
      originalPrice: existing.originalPrice,
      finalPrice: existing.finalPrice,
      discountAmount: existing.discountAmount,
      commissionRate,
      commissionAmount,
      source: "complete",
    });

    // Settle frozen funds to available balance if payment was made via gateway
    if (hasPayment && existing.businessEarned > 0) {
      await settleCompletedLedger(tx, existing.id, existing.businessId, existing.businessEarned);
    }

    await appendBookingActionLog(tx, {
      bookingId: existing.id,
      action: BOOKING_ACTION.COMPLETE,
      actorUserId: userId,
      metadata: { commissionAmount, businessNote },
    });

    const updated = await tx.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: defaultInclude,
    });

    return updated;
  });

  eventEmitter.emit(EVENTS.BOOKING.COMPLETED, {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    completedBy: userId,
    userId: booking.userId,
    commissionAmount: booking.commissionAmount,
    finalPrice: booking.finalPrice,
  });

  return serializeBookingUser(booking);
};

export const markNoShow = async (bookingId, userId) => {
  const booking = await prisma.$transaction(async (tx) => {
    await lockBookingRow(tx, bookingId);
    const existing = await tx.booking.findUnique({
      where: { id: parseInt(bookingId) },
      select: { status: true },
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
      BOOKING_TRANSITION.MARK_NO_SHOW,
      `Chỉ có thể đánh dấu không đến với booking đã xác nhận (hiện tại: ${existing.status})`,
    );

    const updated = await tx.booking.update({
      where: { id: parseInt(bookingId) },
      data: { status: BOOKING_STATUS.NO_SHOW },
      include: defaultInclude,
    });

    await appendBookingActionLog(tx, {
      bookingId: updated.id,
      action: BOOKING_ACTION.NO_SHOW,
      actorUserId: userId,
    });

    return updated;
  });

  eventEmitter.emit(EVENTS.BOOKING.NO_SHOW, {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    markedBy: userId,
    userId: booking.userId,
  });

  return serializeBookingUser(booking);
};

export const bulkConfirm = async (bookingIds, userId) => {
  const results = [];
  for (const id of bookingIds) {
    try {
      const booking = await confirm(id, userId);
      results.push({ id, success: true, booking });
    } catch (error) {
      results.push({ id, success: false, error: error.message });
    }
  }
  return results;
};

export const bulkCancel = async (bookingIds, cancelReason, userId) => {
  const results = [];
  for (const id of bookingIds) {
    try {
      const booking = await cancel(id, cancelReason, userId, "business");
      results.push({ id, success: true, booking });
    } catch (error) {
      results.push({ id, success: false, error: error.message });
    }
  }
  return results;
};

export const getQR = async (bookingId) => {
  const baseUrl =
    process.env.APP_URL || process.env.WEB_URL || "https://didaugio.vn";

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    select: { id: true, bookingCode: true, status: true },
  });

  if (!booking) {
    throw new ServiceError("Booking không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

  if (booking.status !== BOOKING_STATUS.CONFIRMED) {
    throw new ServiceError(
      "Chỉ booking đã xác nhận mới có QR code",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const qrAction = "checkin";
  const qrPayload = buildBookingQRPayload(booking.bookingCode, qrAction);
  const qrCode = await generateBookingQR(booking.bookingCode, baseUrl, qrAction);

  return { bookingCode: booking.bookingCode, qrAction, qrPayload, qrCode };
};

/**
 * Verify/check-in booking QR for business-side scanning flow.
 */
const parseBookingQrPayload = (payload = {}) => {
  const raw =
    payload.qrPayload ||
    payload.payload ||
    payload.data ||
    payload.text ||
    payload.bookingCode ||
    "";
  let parsed = null;

  if (raw && typeof raw === "object") {
    parsed = raw;
  } else if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{")) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        parsed = null;
      }
    }

    if (!parsed && trimmed) {
      const urlMatch = trimmed.match(/\/booking\/verify\/([^/?#]+)/i);
      return {
        bookingCode: decodeURIComponent(urlMatch?.[1] || trimmed)
          .trim()
          .toUpperCase(),
        action: payload.action,
      };
    }
  }

  const bookingCode = String(
    parsed?.bookingCode ||
      parsed?.code ||
      payload.bookingCode ||
      "",
  )
    .trim()
    .toUpperCase();

  return {
    bookingCode,
    action: payload.action || parsed?.action,
    qrType: parsed?.type,
    qrVersion: parsed?.version,
  };
};

export const verifyQR = async (payload = {}, actorUserId, actorRoleId) => {
  const parsedPayload = parseBookingQrPayload(payload);
  const bookingCode = parsedPayload.bookingCode;
  const requestedAction = String(parsedPayload.action || "checkin").toLowerCase();
  const action =
    requestedAction === "verify" || requestedAction === "checkin"
      ? requestedAction
      : "checkin";

  if (!bookingCode) {
    throw new ServiceError(
      "Mã booking không hợp lệ",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  if (parsedPayload.qrType && parsedPayload.qrType !== "didaugio.booking") {
    throw new ServiceError(
      "QR khÃ´ng pháº£i mÃ£ booking cá»§a há»‡ thá»‘ng",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { bookingCode },
      include: {
        ...defaultInclude,
        service: {
          select: {
            id: true,
            name: true,
            price: true,
            businessId: true,
            terms: true,
            place: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!booking) {
      throw new ServiceError(
        "Booking không tồn tại",
        404,
        ERROR_CODES.NOT_FOUND,
      );
    }

    if (actorRoleId > ROLES.ADMIN) {
      const business = await tx.business.findUnique({
        where: { ownerId: actorUserId },
        select: { id: true },
      });

      if (!business || business.id !== booking.businessId) {
        throw new ServiceError(
          "Không phải business của booking này",
          403,
          ERROR_CODES.FORBIDDEN,
        );
      }
    }

    if (
      [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.NO_SHOW].includes(
        booking.status,
      )
    ) {
      throw new ServiceError(
        "Booking đã bị hủy hoặc không đến",
        409,
        ERROR_CODES.BOOKING_INVALID_STATUS,
      );
    }

    if (booking.status === BOOKING_STATUS.COMPLETED) {
      throw new ServiceError(
        "QR đã được sử dụng",
        409,
        ERROR_CODES.BOOKING_ALREADY_CHECKED_IN,
      );
    }

    if (booking.status !== BOOKING_STATUS.CONFIRMED) {
      throw new ServiceError(
        "Booking chưa được xác nhận",
        422,
        ERROR_CODES.BOOKING_NOT_CONFIRMED,
      );
    }

    const graceMinutes = resolveQrGraceMinutes(booking.service?.terms);
    const expiresAt = computeQrExpiryAt(booking, graceMinutes);
    const now = new Date();

    if (expiresAt && now.getTime() > expiresAt.getTime()) {
      throw new ServiceError(
        "QR đã hết hạn",
        409,
        ERROR_CODES.BOOKING_QR_EXPIRED,
      );
    }

    if (action === "verify") {
      return {
        action: "verify",
        graceMinutes,
        expiresAt,
        booking: serializeBookingUser(booking),
      };
    }

    const commissionRate =
      Number(booking.service?.business?.commissionRate) || 10;
    const commissionAmount = Math.floor(
      (booking.finalPrice * commissionRate) / 100,
    );

    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BOOKING_STATUS.COMPLETED,
        completedAt: now,
        commissionAmount,
      },
    });

    await createBookingTransaction(tx, {
      bookingId: booking.id,
      businessId: booking.businessId,
      originalPrice: booking.originalPrice,
      finalPrice: booking.finalPrice,
      discountAmount: booking.discountAmount,
      commissionRate,
      commissionAmount,
      source: "qr_checkin",
    });

    // Settle frozen funds to available balance if payment was made via gateway
    if (booking.businessEarned > 0) {
      await settleCompletedLedger(tx, booking.id, booking.businessId, booking.businessEarned);
    }

    const enriched = await tx.booking.findUnique({
      where: { id: booking.id },
      include: defaultInclude,
    });

    await appendBookingActionLog(tx, {
      bookingId: updated.id,
      action: BOOKING_ACTION.CHECKIN,
      actorUserId,
      metadata: {
        source: "qr_checkin",
        bookingCode: updated.bookingCode,
        usedAt: now.toISOString(),
      },
    });

    return {
      action: "checkin",
      graceMinutes,
      expiresAt,
      booking: serializeBookingUser(enriched),
    };
  });

  if (result.action === "checkin") {
    eventEmitter.emit(EVENTS.BOOKING.COMPLETED, {
      bookingId: result.booking.id,
      bookingCode: result.booking.bookingCode,
      completedBy: actorUserId,
      userId: result.booking.userId,
      commissionAmount: result.booking.commissionAmount,
      finalPrice: result.booking.finalPrice,
      source: "qr_checkin",
    });
  }

  return result;
};

export const markPaid = async (bookingId, payload = {}, userId) => {
  const id = parseInt(bookingId);
  if (Number.isNaN(id)) {
    throw new ServiceError(
      "Booking không hợp lệ",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const booking = await prisma.$transaction(async (tx) => {
    await lockBookingRow(tx, id);
    const existing = await tx.booking.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!existing) {
      throw new ServiceError(
        "Booking không tồn tại",
        404,
        ERROR_CODES.NOT_FOUND,
      );
    }

    if (
      [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.NO_SHOW].includes(
        existing.status,
      )
    ) {
      throw new ServiceError(
        "Không thể xác nhận thanh toán cho booking đã hủy hoặc không đến",
        422,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    if (
      [PAYMENT_STATUS.PAID, PAYMENT_STATUS.FULLY_REFUNDED].includes(
        existing.paymentStatus,
      )
    ) {
      throw new ServiceError(
        "Booking đã được cập nhật thanh toán trước đó",
        422,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const amount = payload.amount
      ? parseInt(payload.amount)
      : existing.finalPrice;
    const paidAt = payload.paidAt ? new Date(payload.paidAt) : new Date();
    const paymentMethod = payload.paymentMethod || "manual";
    const transactionRef = payload.transactionRef || null;

    if (Number.isNaN(amount) || amount <= 0) {
      throw new ServiceError(
        "Số tiền thanh toán không hợp lệ",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    if (Number.isNaN(paidAt.getTime())) {
      throw new ServiceError(
        "Thời gian thanh toán không hợp lệ",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const paymentData = {
      method: "manual",
      actorUserId: userId,
      note: payload.note || null,
    };

    if (existing.payment) {
      await tx.payment.update({
        where: { bookingId: id },
        data: {
          amount,
          paymentMethod,
          transactionRef,
          status: "paid",
          paidAt,
          paymentData,
        },
      });
    } else {
      await tx.payment.create({
        data: {
          bookingId: id,
          userId: existing.userId,
          amount,
          paymentMethod,
          transactionRef,
          status: "paid",
          paidAt,
          paymentData,
        },
      });
    }

    return tx.booking.update({
      where: { id },
      data: {
        paymentStatus: PAYMENT_STATUS.PAID,
      },
      include: {
        ...defaultInclude,
        payment: true,
      },
    });
  });

  return serializeBookingUser(booking);
};

export const refund = async (bookingId, payload = {}, userId) => {
  const id = parseInt(bookingId);
  if (Number.isNaN(id)) {
    throw new ServiceError(
      "Booking không hợp lệ",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  const booking = await prisma.$transaction(async (tx) => {
    await lockBookingRow(tx, id);
    const existing = await tx.booking.findUnique({
      where: { id },
      include: { payment: true },
    });

    if (!existing) {
      throw new ServiceError(
        "Booking không tồn tại",
        404,
        ERROR_CODES.NOT_FOUND,
      );
    }

    if (!existing.payment) {
      throw new ServiceError(
        "Booking chưa có giao dịch thanh toán để hoàn tiền",
        422,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    if (
      ![PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIALLY_REFUNDED].includes(
        existing.paymentStatus,
      )
    ) {
      throw new ServiceError(
        "Booking chưa ở trạng thái có thể hoàn tiền",
        422,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const refundAmount = parseInt(payload.refundAmount);
    const alreadyRefunded = existing.payment.refundAmount || 0;
    const paidAmount = existing.payment.amount || existing.finalPrice;
    const refundableAmount = paidAmount - alreadyRefunded;

    if (Number.isNaN(refundAmount) || refundAmount <= 0) {
      throw new ServiceError(
        "Số tiền hoàn không hợp lệ",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    if (refundAmount > refundableAmount) {
      throw new ServiceError(
        `Số tiền hoàn vượt quá phần còn lại (${refundableAmount})`,
        422,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const totalRefunded = alreadyRefunded + refundAmount;
    const refundedAt = payload.refundedAt
      ? new Date(payload.refundedAt)
      : new Date();
    if (Number.isNaN(refundedAt.getTime())) {
      throw new ServiceError(
        "Thời gian hoàn tiền không hợp lệ",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const nextPaymentStatus =
      totalRefunded >= paidAmount
        ? PAYMENT_STATUS.FULLY_REFUNDED
        : PAYMENT_STATUS.PARTIALLY_REFUNDED;

    const nextPaymentData = {
      ...(existing.payment.paymentData || {}),
      lastRefundBy: userId,
      lastRefundAt: refundedAt,
    };

    const refundRatio =
      refundableAmount > 0 ? refundAmount / refundableAmount : 0;
    const commissionPortionRefunded = Math.floor(
      existing.commissionAmount * refundRatio,
    );
    const businessPortionRefunded = Math.floor(
      existing.businessEarned * refundRatio,
    );
    const nextCommissionAmount = Math.max(
      0,
      existing.commissionAmount - commissionPortionRefunded,
    );
    const nextBusinessEarned = Math.max(
      0,
      existing.businessEarned - businessPortionRefunded,
    );

    // Debit platform wallet for commission reversal
    if (commissionPortionRefunded > 0) {
      const platformWallet = await tx.platformWallet.findFirst();
      if (platformWallet) {
        await tx.platformWallet.update({
          where: { id: platformWallet.id },
          data: {
            balance: { decrement: commissionPortionRefunded },
            totalEarned: { decrement: commissionPortionRefunded },
          },
        });
      }
    }

    if (businessPortionRefunded > 0) {
      const debitField =
        existing.status === BOOKING_STATUS.COMPLETED ? "balance" : "frozenBalance";
      await tx.partnerWallet.update({
        where: { businessId: existing.businessId },
        data: {
          [debitField]: { decrement: businessPortionRefunded },
        },
      });

      await tx.financialLedger.create({
        data: {
          bookingId: existing.id,
          type: "REFUND",
          amount: businessPortionRefunded,
          description: `Hoan tien phan doanh thu doi tac cho booking #${existing.id}`,
        },
      });
    }

    await tx.payment.update({
      where: { bookingId: id },
      data: {
        refundAmount: totalRefunded,
        refundedAt,
        refundReason:
          payload.refundReason || existing.payment.refundReason || null,
        status:
          nextPaymentStatus === PAYMENT_STATUS.FULLY_REFUNDED
            ? "fully_refunded"
            : "partially_refunded",
        paymentData: nextPaymentData,
      },
    });

    return tx.booking.update({
      where: { id },
      data: {
        paymentStatus: nextPaymentStatus,
        commissionAmount: nextCommissionAmount,
        businessEarned: nextBusinessEarned,
      },
      include: {
        ...defaultInclude,
        payment: true,
      },
    });
  });

  return serializeBookingUser(booking);
};
