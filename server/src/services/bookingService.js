import prisma from "../config/prismaClient.js";
import { PAGINATION, ROLES, BOOKING_STATUS } from "../config/constants.js";
import eventEmitter, { EVENTS } from "../utils/eventEmitter.js";
import { generateBookingQR } from "../utils/generateQR.js";

const defaultInclude = {
  service: {
    select: { id: true, name: true, price: true, businessId: true },
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

const serializeBookingUser = (booking) => {
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
  if (params.search) {
    where.OR = [
      { bookingCode: { contains: params.search, mode: "insensitive" } },
      { user: { fullName: { contains: params.search, mode: "insensitive" } } },
    ];
  }
  if (params.fromDate) {
    where.bookingDate = {
      ...where.bookingDate,
      gte: new Date(params.fromDate),
    };
  }
  if (params.toDate) {
    where.bookingDate = { ...where.bookingDate, lte: new Date(params.toDate) };
  }

  const orderBy =
    params.sortBy === "oldest"
      ? { createdAt: "asc" }
      : params.sortBy === "booking_date"
        ? { bookingDate: "desc" }
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

export const confirm = async (bookingId, userId) => {
  const baseUrl =
    process.env.APP_URL || process.env.WEB_URL || "https://didaugio.vn";

  const booking = await prisma.$transaction(async (tx) => {
    const existing = await tx.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: { service: true, user: true },
    });

    if (!existing || existing.status !== BOOKING_STATUS.PENDING) {
      throw Object.assign(new Error("Booking không hợp lệ hoặc đã xử lý"), {
        statusCode: 400,
      });
    }

    const qrCode = await generateBookingQR(existing.bookingCode, baseUrl);

    return tx.booking.update({
      where: { id: parseInt(bookingId) },
      data: {
        status: BOOKING_STATUS.CONFIRMED,
        qrCode,
        qrGeneratedAt: new Date(),
      },
      include: defaultInclude,
    });
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
    const existing = await tx.booking.findUnique({
      where: { id: parseInt(bookingId) },
    });

    if (
      !existing ||
      ![BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED].includes(
        existing.status,
      )
    ) {
      throw Object.assign(new Error("Booking không hợp lệ hoặc đã xử lý"), {
        statusCode: 400,
      });
    }

    return tx.booking.update({
      where: { id: parseInt(bookingId) },
      data: {
        status: BOOKING_STATUS.CANCELLED,
        cancelReason,
        cancelledAt: new Date(),
      },
      include: defaultInclude,
    });
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
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    select: { id: true, bookingCode: true, qrCode: true, status: true },
  });

  if (!booking) {
    throw Object.assign(new Error("Booking không tồn tại"), {
      statusCode: 404,
    });
  }

  if (!booking.qrCode) {
    throw Object.assign(new Error("QR code chưa được tạo"), {
      statusCode: 404,
    });
  }

  return { bookingCode: booking.bookingCode, qrCode: booking.qrCode };
};
