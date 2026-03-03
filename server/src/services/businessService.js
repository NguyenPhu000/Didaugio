import prisma from "../config/prismaClient.js";
import { PAGINATION, BUSINESS_STATUS } from "../config/constants.js";
import eventEmitter, { EVENTS } from "../utils/eventEmitter.js";

const defaultInclude = {
  owner: {
    select: {
      id: true,
      email: true,
      profile: { select: { fullName: true } },
    },
  },
};

const serializeBusiness = (business) => {
  if (!business) return null;
  const { bankAccount, bankOwner, ...rest } = business;
  const result = {
    ...rest,
    commissionRate:
      business.commissionRate?.toString?.() ?? business.commissionRate,
    bankAccountNumber: bankAccount ?? null,
    bankAccountOwner: bankOwner ?? null,
  };
  if (result.owner) {
    result.owner = {
      id: result.owner.id,
      email: result.owner.email,
      fullName: result.owner.profile?.fullName ?? null,
    };
  }
  return result;
};

/** Map API field names to Prisma schema (bankAccountNumber -> bankAccount, etc.) */
const mapBusinessDataToPrisma = (data) => {
  const { bankAccountNumber, bankAccountOwner, ...rest } = data;
  return {
    ...rest,
    ...(bankAccountNumber !== undefined && { bankAccount: bankAccountNumber }),
    ...(bankAccountOwner !== undefined && { bankOwner: bankAccountOwner }),
  };
};

export const getProfile = async (userId) => {
  if (!userId) {
    const error = new Error("Chưa xác thực người dùng");
    error.statusCode = 401;
    throw error;
  }

  const business = await prisma.business.findUnique({
    where: { ownerId: userId },
    include: {
      ...defaultInclude,
      _count: { select: { places: true, services: true, vouchers: true } },
    },
  });

  if (!business) {
    const error = new Error("Bạn chưa đăng ký doanh nghiệp");
    error.statusCode = 404;
    throw error;
  }

  return serializeBusiness(business);
};

export const register = async (data, userId) => {
  const existing = await prisma.business.findUnique({
    where: { ownerId: userId },
  });

  if (existing) {
    const error = new Error("Bạn đã có hồ sơ doanh nghiệp");
    error.statusCode = 400;
    throw error;
  }

  const prismaData = mapBusinessDataToPrisma(data);
  const business = await prisma.business.create({
    data: {
      ...prismaData,
      ownerId: userId,
      status: BUSINESS_STATUS.PENDING,
    },
    include: defaultInclude,
  });

  const serialized = serializeBusiness(business);

  eventEmitter.emit(EVENTS.BUSINESS.REGISTERED, {
    businessId: business.id,
    userId,
    businessName: business.businessName,
  });

  return serialized;
};

export const updateProfile = async (data, userId) => {
  const business = await prisma.business.findUnique({
    where: { ownerId: userId },
  });

  if (!business) {
    const error = new Error("Bạn chưa đăng ký doanh nghiệp");
    error.statusCode = 404;
    throw error;
  }

  const prismaData = mapBusinessDataToPrisma(data);

  if (business.status === BUSINESS_STATUS.REJECTED) {
    prismaData.status = BUSINESS_STATUS.PENDING;
    prismaData.rejectionReason = null;
    prismaData.approvedBy = null;
    prismaData.approvedAt = null;
  }

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: prismaData,
    include: defaultInclude,
  });

  if (
    business.status === BUSINESS_STATUS.REJECTED &&
    updated.status === BUSINESS_STATUS.PENDING
  ) {
    eventEmitter.emit(EVENTS.BUSINESS.RESUBMITTED, {
      businessId: updated.id,
      ownerId: updated.ownerId,
      businessName: updated.businessName,
    });
  }

  return serializeBusiness(updated);
};

export const getAll = async (params = {}) => {
  const page = parseInt(params.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(params.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT,
  );
  const skip = (page - 1) * limit;

  const where = {};
  if (params.search) {
    where.OR = [
      { businessName: { contains: params.search, mode: "insensitive" } },
      {
        owner: {
          profile: {
            fullName: { contains: params.search, mode: "insensitive" },
          },
        },
      },
      { owner: { email: { contains: params.search, mode: "insensitive" } } },
    ];
  }
  if (params.status && params.status !== "all") {
    where.status = params.status;
  }

  const orderBy =
    params.sortBy === "oldest"
      ? { createdAt: "asc" }
      : params.sortBy === "name"
        ? { businessName: "asc" }
        : { createdAt: "desc" };

  const [rawData, total] = await Promise.all([
    prisma.business.findMany({
      where,
      include: {
        ...defaultInclude,
        _count: { select: { places: true, services: true } },
      },
      skip,
      take: limit,
      orderBy,
    }),
    prisma.business.count({ where }),
  ]);

  const data = rawData.map(serializeBusiness);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getById = async (id) => {
  const business = await prisma.business.findUnique({
    where: { id: parseInt(id) },
    include: {
      ...defaultInclude,
      _count: { select: { places: true, services: true, vouchers: true } },
    },
  });

  if (!business) {
    const error = new Error("Doanh nghiệp không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  return serializeBusiness(business);
};

export const approve = async (id, data = {}, approvedBy) => {
  const updateData = {
    status: BUSINESS_STATUS.APPROVED,
    approvedAt: new Date(),
  };
  if (approvedBy != null) {
    updateData.approvedBy = approvedBy;
  }
  if (data.commissionRate != null && data.commissionRate !== "") {
    updateData.commissionRate = Number(data.commissionRate);
  }
  const business = await prisma.business.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: defaultInclude,
  });

  eventEmitter.emit(EVENTS.BUSINESS.APPROVED, {
    businessId: business.id,
    approvedBy,
    ownerId: business.ownerId,
  });

  return serializeBusiness(business);
};

export const reject = async (id, rejectionReason, rejectedBy) => {
  const business = await prisma.business.update({
    where: { id: parseInt(id) },
    data: {
      status: BUSINESS_STATUS.REJECTED,
      rejectionReason,
    },
    include: defaultInclude,
  });

  eventEmitter.emit(EVENTS.BUSINESS.REJECTED, {
    businessId: business.id,
    rejectedBy,
    reason: rejectionReason,
    ownerId: business.ownerId,
  });

  return serializeBusiness(business);
};

export const getDashboard = async (userId) => {
  const business = await prisma.business.findUnique({
    where: { ownerId: userId },
    select: { id: true },
  });

  if (!business) {
    const error = new Error("Bạn chưa đăng ký doanh nghiệp");
    error.statusCode = 404;
    throw error;
  }

  const [placesCount, servicesCount, bookingsCount, bookingsByStatus, revenue] =
    await Promise.all([
      prisma.place.count({
        where: { businessId: business.id, deletedAt: null },
      }),
      prisma.businessService.count({ where: { businessId: business.id } }),
      prisma.booking.count({ where: { service: { businessId: business.id } } }),
      prisma.booking.groupBy({
        by: ["status"],
        where: { service: { businessId: business.id } },
        _count: { id: true },
      }),
      prisma.booking.aggregate({
        where: {
          service: { businessId: business.id },
          status: "completed",
        },
        _sum: { finalPrice: true, commissionAmount: true },
      }),
    ]);

  return {
    placesCount,
    servicesCount,
    bookingsCount,
    bookingsByStatus: bookingsByStatus.reduce(
      (acc, item) => ({ ...acc, [item.status]: item._count.id }),
      {},
    ),
    totalRevenue: revenue._sum.finalPrice || 0,
    totalCommission: revenue._sum.commissionAmount || 0,
    netRevenue:
      (revenue._sum.finalPrice || 0) - (revenue._sum.commissionAmount || 0),
  };
};
