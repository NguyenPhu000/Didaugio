import prisma from "../config/prismaClient.js";
import { PAGINATION, ROLES } from "../config/constants.js";

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

export const getById = async (id) => {
  const voucher = await prisma.voucher.findUnique({
    where: { id: parseInt(id) },
    include: {
      ...defaultInclude,
      business: { select: { id: true, businessName: true } },
    },
  });

  if (!voucher) {
    throw Object.assign(new Error("Voucher không tồn tại"), {
      statusCode: 404,
    });
  }

  return serializeVoucher(voucher);
};

export const create = async (data, userId) => {
  const business = await prisma.business.findUnique({
    where: { ownerId: userId },
    select: { id: true },
  });

  if (!business) {
    throw Object.assign(new Error("Bạn chưa đăng ký doanh nghiệp"), {
      statusCode: 403,
    });
  }

  const existing = await prisma.voucher.findFirst({
    where: { code: data.code, businessId: business.id },
  });
  if (existing) {
    throw Object.assign(new Error("Mã voucher đã tồn tại"), {
      statusCode: 400,
    });
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
    throw Object.assign(new Error("Không thể xóa voucher đang được sử dụng"), {
      statusCode: 400,
    });
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
      maxUsage: true,
      usageCount: true,
      _count: { select: { bookings: true } },
    },
  });

  if (!voucher) {
    throw Object.assign(new Error("Voucher không tồn tại"), {
      statusCode: 404,
    });
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
