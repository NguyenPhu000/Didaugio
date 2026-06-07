import prisma from "../../config/prismaClient.js";
import { PAGINATION, ROLES } from "../../config/constants.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";

/**
 * Validates a voucher for a given booking context and returns the discount amount.
 * Throws ServiceError if voucher is invalid.
 * @param {import("@prisma/client").Prisma.TransactionClient} tx
 * @param {{ voucherId: number, serviceId: number, businessId: number, userId: number, originalPrice: number }} params
 * @returns {{ voucherId: number, discountAmount: number, voucher: object }} discount result
 */
export async function validateAndApplyVoucher(tx, params) {
  const { voucherId, serviceId, businessId, userId, originalPrice } = params;

  const voucher = await tx.voucher.findFirst({
    where: {
      id: voucherId,
      isActive: true,
    },
  });

  if (!voucher) {
    throw new ServiceError("Mã voucher không hợp lệ hoặc đã bị vô hiệu hóa", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  if (voucher.businessId !== null && voucher.businessId !== businessId) {
    throw new ServiceError("Mã voucher không áp dụng cho dịch vụ này", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const now = new Date();
  if (voucher.startDate && now < voucher.startDate) {
    throw new ServiceError("Mã voucher chưa có hiệu lực", 400, ERROR_CODES.VALIDATION_ERROR);
  }
  if (voucher.endDate && now > voucher.endDate) {
    throw new ServiceError("Mã voucher đã hết hạn", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  if (voucher.usageLimit !== null && voucher.usageLimit > 0 && voucher.usageCount >= voucher.usageLimit) {
    throw new ServiceError("Mã voucher đã hết lượt sử dụng", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  if (voucher.minOrderValue && originalPrice < voucher.minOrderValue) {
    throw new ServiceError(
      `Giá trị đơn hàng tối thiểu là ${voucher.minOrderValue.toLocaleString("vi-VN")}đ`,
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  if (voucher.applicableServices && Array.isArray(voucher.applicableServices) && voucher.applicableServices.length > 0) {
    if (!voucher.applicableServices.includes(serviceId)) {
      throw new ServiceError("Mã voucher không áp dụng cho dịch vụ này", 400, ERROR_CODES.VALIDATION_ERROR);
    }
  }

  const userUsageCount = await tx.booking.count({
    where: {
      voucherId: voucher.id,
      userId,
      status: { notIn: ["cancelled", "rejected", "expired"] },
    },
  });

  const perUserLimit = voucher.perUserLimit ?? 1;
  if (userUsageCount >= perUserLimit) {
    throw new ServiceError("Bạn đã sử dụng mã voucher này rồi", 400, ERROR_CODES.VALIDATION_ERROR);
  }

  let discountAmount = 0;
  if (voucher.discountType === "PERCENT") {
    discountAmount = Math.floor((originalPrice * voucher.discountValue) / 100);
    if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
      discountAmount = voucher.maxDiscount;
    }
  } else {
    discountAmount = Math.min(voucher.discountValue, originalPrice);
  }

  return { voucherId: voucher.id, discountAmount, voucher };
}

/**
 * Increment voucher usage count after a booking is created.
 * @param {import("@prisma/client").Prisma.TransactionClient} tx
 * @param {number} voucherId
 */
export async function incrementVoucherUsage(tx, voucherId) {
  await tx.voucher.update({
    where: { id: voucherId },
    data: { usageCount: { increment: 1 } },
  });
}

const defaultInclude = {
  _count: { select: { bookings: true } },
};

const toIntOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const serializeVoucher = (voucher) => {
  if (!voucher) return null;

  return {
    ...voucher,
    maxUsage: voucher.usageLimit ?? 0,
    maxUsagePerUser: voucher.perUserLimit ?? 1,
  };
};

const mapVoucherInputToPrisma = (data = {}, isCreate = false) => {
  const mapped = { ...data };

  if ("maxUsage" in mapped) {
    mapped.usageLimit = toIntOrNull(mapped.maxUsage);
    delete mapped.maxUsage;
  }

  if ("maxUsagePerUser" in mapped) {
    mapped.perUserLimit = toIntOrNull(mapped.maxUsagePerUser);
    delete mapped.maxUsagePerUser;
  }

  if ("startDate" in mapped) {
    mapped.startDate = toDateOrNull(mapped.startDate);
  }

  if ("endDate" in mapped) {
    mapped.endDate = toDateOrNull(mapped.endDate);
  }

  if ("discountValue" in mapped) {
    mapped.discountValue = Number(mapped.discountValue);
  }

  if ("minOrderValue" in mapped) {
    mapped.minOrderValue = Number(mapped.minOrderValue || 0);
  }

  if ("maxDiscount" in mapped) {
    mapped.maxDiscount = toIntOrNull(mapped.maxDiscount);
  }

  if (isCreate) {
    if (!mapped.name || mapped.name.trim() === "") {
      mapped.name = mapped.code;
    }
    if (!mapped.startDate) {
      mapped.startDate = new Date();
    }
    if (!mapped.endDate) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      mapped.endDate = endDate;
    }
  }

  return mapped;
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
    where.businessId = business.id;
  } else if (params.businessId) {
    where.businessId = parseInt(params.businessId);
  }

  if (params.search) {
    where.OR = [
      { code: { contains: params.search, mode: "insensitive" } },
      { name: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.isActive !== undefined) {
    where.isActive = params.isActive === "true" || params.isActive === true;
  }

  const [data, total] = await Promise.all([
    prisma.voucher.findMany({
      where,
      include: defaultInclude,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.voucher.count({ where }),
  ]);

  return {
    data: data.map(serializeVoucher),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getById = async (id, options = {}) => {
  const { businessId } = options;
  const where = { id: parseInt(id) };
  if (businessId != null) {
    where.businessId = businessId;
  }

  const voucher = await prisma.voucher.findFirst({
    where,
    include: {
      ...defaultInclude,
      business: { select: { id: true, businessName: true } },
    },
  });

  if (!voucher) {
    throw new ServiceError("Voucher không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

  return serializeVoucher(voucher);
};

export const create = async (data, userId) => {
  const business = await prisma.business.findUnique({
    where: { ownerId: userId },
    select: { id: true },
  });

  if (!business) {
    throw new ServiceError(
      "Bạn chưa đăng ký doanh nghiệp",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  const existing = await prisma.voucher.findFirst({
    where: { code: data.code, businessId: business.id },
  });
  if (existing) {
    throw new ServiceError("Mã voucher đã tồn tại", 400, ERROR_CODES.EXISTED);
  }

  const mappedData = mapVoucherInputToPrisma(data, true);

  const voucher = await prisma.voucher.create({
    data: {
      ...mappedData,
      businessId: business.id,
    },
    include: defaultInclude,
  });

  return serializeVoucher(voucher);
};

export const update = async (id, data) => {
  const updateData = mapVoucherInputToPrisma(data);

  if (!updateData.name && data.name === "") {
    delete updateData.name;
  }

  const voucher = await prisma.voucher.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: defaultInclude,
  });

  return serializeVoucher(voucher);
};

export const remove = async (id) => {
  const bookingCount = await prisma.booking.count({
    where: {
      voucherId: parseInt(id),
      status: { in: ["pending", "confirmed"] },
    },
  });

  if (bookingCount > 0) {
    throw new ServiceError(
      "Không thể xóa voucher đang được sử dụng",
      400,
      ERROR_CODES.VALIDATION_ERROR,
    );
  }

  await prisma.voucher.delete({ where: { id: parseInt(id) } });
  return true;
};

export const getUsageStats = async (id) => {
  const voucher = await prisma.voucher.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      code: true,
      usageLimit: true,
      usageCount: true,
      _count: { select: { bookings: true } },
    },
  });

  if (!voucher) {
    throw new ServiceError("Voucher không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

  const serialized = serializeVoucher(voucher);

  return {
    ...serialized,
    remaining: (serialized.maxUsage || 0) - (voucher.usageCount || 0),
  };
};

export const bulkDeactivate = async (voucherIds, userId) => {
  const business = await prisma.business.findUnique({
    where: { ownerId: userId },
    select: { id: true },
  });

  const result = await prisma.voucher.updateMany({
    where: {
      id: { in: voucherIds },
      ...(business ? { businessId: business.id } : {}),
    },
    data: { isActive: false },
  });

  return result;
};
