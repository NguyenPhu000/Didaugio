import prisma from "../config/prismaClient.js";
import {
  PAGINATION,
  ROLES,
  BOOKING_STATUS,
  PAYMENT_STATUS,
} from "../config/constants.js";
import { ERROR_CODES } from "../config/messages.js";
import eventEmitter, { EVENTS } from "../utils/eventEmitter.js";
import { generateBookingQR } from "../utils/generateQR.js";
import ServiceError from "../utils/serviceError.js";
import { combineUseDateAndTime } from "../utils/bookingTimeSlot.js";
import { checkAvailability, lockBookingRow } from "./bookingAvailability.js";
import {
  appendBookingActionLog,
  BOOKING_ACTION,
} from "./bookingActionLogService.js";
import { toUseDateOnly, toUseTimeString } from "../utils/bookingTimeSlot.js";

const defaultInclude = {
  service: {
    select: {
      id: true,
      name: true,
      price: true,
      businessId: true,
      place: { select: { id: true, name: true } },
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
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const QR_CREATED_WINDOW_MS = 2 * 60 * 60 * 1000;
const DEFAULT_QR_GRACE_MINUTES = 30;
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

  const qrCode = await generateBookingQR(booking.bookingCode, baseUrl);
  return { bookingCode: booking.bookingCode, qrCode };
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
    const error = new Error("Booking không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  return serializeBookingUser(booking);
};

export const getStats = async (userId, roleId) => {
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

  const unitPrice = service.salePrice ?? service.price;
  const originalPrice = unitPrice * quantity;
  const finalPrice = originalPrice;
  const useDate = toUseDateOnly(bookingAt);
  const useTime = payload.useTime || toUseTimeString(bookingAt);

  const guestName =
    payload.guestName || user.profile?.fullName || user.email || "Khách";
  const guestPhone = payload.guestPhone || user.profile?.phone || "0000000000";
  const guestEmail = payload.guestEmail || user.email || null;

  const depositPolicy = getDepositConfig(service);

  const bookingResult = await prisma.$transaction(async (tx) => {
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
        guestName,
        guestPhone,
        guestEmail,
        guestNote: payload.note || null,
        originalPrice,
        discountAmount: 0,
        finalPrice,
        paymentStatus: PAYMENT_STATUS.UNPAID,
        status: BOOKING_STATUS.PENDING,
      },
      include: defaultInclude,
    });

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

export const confirm = async (bookingId, userId) => {
  const booking = await prisma.$transaction(async (tx) => {
    await lockBookingRow(tx, bookingId);
    const existing = await tx.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: { service: true, user: true },
    });

    if (!existing || existing.status !== BOOKING_STATUS.PENDING) {
      throw new ServiceError(
        "Booking không hợp lệ hoặc đã xử lý",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

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

    const updated = await tx.booking.update({
      where: { id: parseInt(bookingId) },
      data: {
        status: BOOKING_STATUS.CONFIRMED,
        confirmedAt: new Date(),
      },
      include: defaultInclude,
    });

    await appendBookingActionLog(tx, {
      bookingId: updated.id,
      action: BOOKING_ACTION.APPROVE,
      actorUserId: userId,
      metadata: { source: "confirm" },
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

export const cancel = async (bookingId, cancelReason, userId) => {
  const booking = await prisma.$transaction(async (tx) => {
    await lockBookingRow(tx, bookingId);
    const existing = await tx.booking.findUnique({
      where: { id: parseInt(bookingId) },
    });

    if (
      !existing ||
      ![BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED].includes(
        existing.status,
      )
    ) {
      throw new ServiceError(
        "Booking không hợp lệ hoặc đã xử lý",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

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

    await appendBookingActionLog(tx, {
      bookingId: updated.id,
      action: BOOKING_ACTION.REJECT,
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

export const complete = async (bookingId, userId) => {
  const booking = await prisma.$transaction(async (tx) => {
    const existing = await tx.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: { service: { include: { business: true } } },
    });

    if (!existing || existing.status !== BOOKING_STATUS.CONFIRMED) {
      throw Object.assign(
        new Error("Chỉ có thể hoàn thành booking đã xác nhận"),
        {
          statusCode: 400,
        },
      );
    }

    const commissionRate = existing.service.business?.commissionRate || 10;
    const commissionAmount = (existing.finalPrice * commissionRate) / 100;

    return tx.booking.update({
      where: { id: parseInt(bookingId) },
      data: {
        status: BOOKING_STATUS.COMPLETED,
        completedAt: new Date(),
        commissionAmount,
        paymentStatus: "paid",
      },
      include: defaultInclude,
    });
  });

  eventEmitter.emit(EVENTS.BOOKING.COMPLETED, {
    bookingId: booking.id,
    bookingCode: booking.bookingCode,
    completedBy: userId,
    userId: booking.userId,
  });

  return serializeBookingUser(booking);
};

export const markNoShow = async (bookingId, userId) => {
  const existing = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    select: { status: true },
  });
  if (!existing) {
    throw new ServiceError("Booking không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }
  if (existing.status !== BOOKING_STATUS.CONFIRMED) {
    const err = new ServiceError(
      `Chỉ có thể đánh dấu không đến với booking đã xác nhận (hiện tại: ${existing.status})`,
      422,
    );
    throw err;
  }

  const booking = await prisma.booking.update({
    where: { id: parseInt(bookingId) },
    data: { status: BOOKING_STATUS.NO_SHOW },
    include: defaultInclude,
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
      const booking = await cancel(id, cancelReason, userId);
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

  const qrCode = await generateBookingQR(booking.bookingCode, baseUrl);

  return { bookingCode: booking.bookingCode, qrCode };
};

/**
 * Verify/check-in booking QR for business-side scanning flow.
 */
export const verifyQR = async (payload = {}, actorUserId, actorRoleId) => {
  const bookingCode = String(payload.bookingCode || "")
    .trim()
    .toUpperCase();
  const requestedAction = String(payload.action || "checkin").toLowerCase();
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

    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BOOKING_STATUS.COMPLETED,
        completedAt: now,
      },
      include: defaultInclude,
    });

    await appendBookingActionLog(tx, {
      bookingId: updated.id,
      action: BOOKING_ACTION.APPROVE,
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
      booking: serializeBookingUser(updated),
    };
  });

  if (result.action === "checkin") {
    eventEmitter.emit(EVENTS.BOOKING.COMPLETED, {
      bookingId: result.booking.id,
      bookingCode: result.booking.bookingCode,
      completedBy: actorUserId,
      userId: result.booking.userId,
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
      ![
        PAYMENT_STATUS.PAID,
        PAYMENT_STATUS.PARTIALLY_REFUNDED,
        PAYMENT_STATUS.FULLY_REFUNDED,
      ].includes(existing.paymentStatus)
    ) {
      throw new ServiceError(
        "Booking chưa ở trạng thái có thể hoàn tiền",
        422,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    if (existing.paymentStatus === PAYMENT_STATUS.FULLY_REFUNDED) {
      throw new ServiceError(
        "Booking đã hoàn tiền toàn phần",
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
      data: { paymentStatus: nextPaymentStatus },
      include: {
        ...defaultInclude,
        payment: true,
      },
    });
  });

  return serializeBookingUser(booking);
};
