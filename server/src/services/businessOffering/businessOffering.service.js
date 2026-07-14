/**
 * Business Offering Service - CRUD dịch vụ/sản phẩm mà doanh nghiệp cung cấp
 * (Entity: BusinessService trong Prisma)
 */
import prisma from "../../config/prismaClient.js";
import { PAGINATION, ROLES } from "../../config/constants.js";
import { assertBusinessLimit } from "../subscription/subscriptionEntitlement.service.js";

const defaultInclude = {
  place: { select: { id: true, name: true } },
  _count: { select: { bookings: true } },
};

const toIntOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const DEPOSIT_CONFIG_KEYS = [
  "requireDeposit",
  "depositType",
  "depositAmount",
  "depositRefundable",
  "depositRefundPercent",
];

// TODO(phase-next): migrate depositConfig from `terms` JSON to dedicated Prisma columns.

const parseTermsMeta = (terms) => {
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

const normalizeDepositConfig = (input = {}) => {
  const requireDeposit =
    input.requireDeposit === true || String(input.requireDeposit) === "true";
  const depositType = input.depositType === "FIXED" ? "FIXED" : "PERCENT";
  const rawDepositAmount = toIntOrNull(input.depositAmount);
  const depositAmount =
    rawDepositAmount == null
      ? null
      : depositType === "PERCENT"
        ? Math.max(0, Math.min(100, rawDepositAmount))
        : Math.max(0, rawDepositAmount);

  let depositRefundable = input.depositRefundable;
  if (typeof depositRefundable !== "boolean") {
    depositRefundable = String(depositRefundable) !== "false";
  }

  const rawRefundPercent = toIntOrNull(input.depositRefundPercent);
  const depositRefundPercent = Math.max(
    0,
    Math.min(100, rawRefundPercent == null ? 50 : rawRefundPercent),
  );

  if (!requireDeposit) {
    return {
      requireDeposit: false,
      depositType: null,
      depositAmount: null,
      depositRefundable: true,
      depositRefundPercent: 50,
    };
  }

  return {
    requireDeposit: true,
    depositType,
    depositAmount,
    depositRefundable,
    depositRefundPercent,
  };
};

const getDepositConfigFromTerms = (terms) => {
  const meta = parseTermsMeta(terms);
  const raw = meta?.depositConfig || {};
  return normalizeDepositConfig(raw);
};

const getDepositConfig = (service) => getDepositConfigFromTerms(service?.terms);

const hasDepositConfigInput = (data = {}) =>
  DEPOSIT_CONFIG_KEYS.some((key) => key in data);

// Keep legacy `terms` payload intact while storing normalized deposit policy metadata.
const mergeDepositConfigIntoTerms = (existingTerms, data = {}) => {
  if (!hasDepositConfigInput(data)) {
    return existingTerms || null;
  }

  const existingMeta = parseTermsMeta(existingTerms) || {};
  if (
    Object.keys(existingMeta).length === 0 &&
    typeof existingTerms === "string" &&
    existingTerms.trim()
  ) {
    existingMeta.legacyTerms = existingTerms.trim();
  }

  const fallback = getDepositConfigFromTerms(existingTerms);
  const next = normalizeDepositConfig({
    ...fallback,
    ...data,
  });

  existingMeta.depositConfig = next;
  return JSON.stringify(existingMeta);
};

// Deposit keys are temporary API fields and must not be written directly to Prisma columns yet.
const stripDepositConfigKeys = (data = {}) => {
  const next = { ...data };
  DEPOSIT_CONFIG_KEYS.forEach((key) => {
    delete next[key];
  });
  return next;
};

const serializeOffering = (offering) => {
  if (!offering) return null;

  const normalizedImages = Array.isArray(offering.images)
    ? offering.images.filter((item) => typeof item === "string")
    : [];
  const depositConfig = getDepositConfig(offering);

  return {
    ...offering,
    discountPrice: offering.salePrice ?? null,
    duration: offering.durationMinutes ?? null,
    thumbnail: offering.thumbnail ?? null,
    images: normalizedImages,
    requireDeposit: depositConfig.requireDeposit,
    depositType: depositConfig.depositType,
    depositAmount: depositConfig.depositAmount,
    depositRefundable: depositConfig.depositRefundable,
    depositRefundPercent: depositConfig.depositRefundPercent,
  };
};

const mapInputToPrisma = (data = {}) => {
  const mapped = { ...data };

  if ("discountPrice" in mapped) {
    mapped.salePrice = toIntOrNull(mapped.discountPrice);
    delete mapped.discountPrice;
  }

  if ("duration" in mapped) {
    mapped.durationMinutes = toIntOrNull(mapped.duration);
    delete mapped.duration;
  }

  if ("placeId" in mapped) {
    mapped.placeId = toIntOrNull(mapped.placeId);
  }

  if ("price" in mapped) {
    mapped.price = Number(mapped.price);
  }

  if ("maxCapacity" in mapped) {
    mapped.maxCapacity = toIntOrNull(mapped.maxCapacity);
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
    where.name = { contains: params.search, mode: "insensitive" };
  }
  if (params.placeId) {
    where.placeId = parseInt(params.placeId);
  }
  if (params.isActive !== undefined) {
    where.isActive = params.isActive === "true" || params.isActive === true;
  }
  if (params.serviceType) {
    where.serviceType = params.serviceType;
  }

  const orderBy =
    params.sortBy === "price_asc"
      ? { price: "asc" }
      : params.sortBy === "price_desc"
        ? { price: "desc" }
        : { createdAt: "desc" };

  const [data, total] = await Promise.all([
    prisma.businessService.findMany({
      where,
      include: defaultInclude,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.businessService.count({ where }),
  ]);

  return {
    data: data.map(serializeOffering),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getById = async (id, options = {}) => {
  const { businessId } = options;
  const where = { id: parseInt(id) };
  if (businessId != null) {
    where.businessId = businessId;
  }

  const offering = await prisma.businessService.findFirst({
    where,
    include: {
      ...defaultInclude,
      business: { select: { id: true, businessName: true } },
    },
  });

  if (!offering) {
    const error = new Error("Dịch vụ không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  return serializeOffering(offering);
};

export const create = async (data, userId) => {
  const business = await prisma.business.findUnique({
    where: { ownerId: userId },
    select: { id: true },
  });

  if (!business) {
    const error = new Error("Bạn chưa đăng ký doanh nghiệp");
    error.statusCode = 403;
    throw error;
  }

  const currentServiceCount = await prisma.businessService.count({
    where: { businessId: business.id },
  });
  await assertBusinessLimit(business.id, "maxServices", currentServiceCount);

  const mappedData = mapInputToPrisma(data);
  mappedData.terms = mergeDepositConfigIntoTerms(null, mappedData);
  const cleanMappedData = stripDepositConfigKeys(mappedData);

  let placeId = cleanMappedData.placeId;

  // Query tìm place theo businessId HOẶC createdBy (xử lý trường hợp place tạo trước khi đăng ký business)
  const placeWhere = {
    deletedAt: null,
    OR: [{ businessId: business.id }, { createdBy: userId }],
  };

  if (!placeId) {
    const firstPlace = await prisma.place.findFirst({
      where: placeWhere,
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    if (!firstPlace) {
      const error = new Error(
        "Bạn cần tạo ít nhất 1 địa điểm trước khi tạo dịch vụ",
      );
      error.statusCode = 400;
      throw error;
    }

    placeId = firstPlace.id;
  } else {
    // Validate place thuộc về business này
    const validPlace = await prisma.place.findFirst({
      where: { id: parseInt(placeId), ...placeWhere },
      select: { id: true },
    });
    if (!validPlace) {
      const error = new Error(
        "Địa điểm không tồn tại hoặc không thuộc doanh nghiệp của bạn",
      );
      error.statusCode = 400;
      throw error;
    }
  }

  delete cleanMappedData.placeId;

  const offering = await prisma.businessService.create({
    data: {
      ...cleanMappedData,
      place: {
        connect: { id: placeId },
      },
      business: {
        connect: { id: business.id },
      },
    },
    include: defaultInclude,
  });

  return serializeOffering(offering);
};

export const update = async (id, data, options = {}) => {
  const { businessId } = options;
  const parsedId = parseInt(id);
  const where = { id: parsedId };
  if (businessId != null) {
    where.businessId = businessId;
  }

  const existing = await prisma.businessService.findFirst({ where });
  if (!existing) {
    const error = new Error("Dịch vụ không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  const mappedData = mapInputToPrisma(data);
  mappedData.terms = mergeDepositConfigIntoTerms(existing.terms, mappedData);
  const cleanMappedData = stripDepositConfigKeys(mappedData);

  const placeId = cleanMappedData.placeId;
  if (placeId) {
    cleanMappedData.place = {
      connect: { id: placeId },
    };
  }
  delete cleanMappedData.placeId;

  const offering = await prisma.businessService.update({
    where: { id: existing.id },
    data: cleanMappedData,
    include: defaultInclude,
  });

  return serializeOffering(offering);
};

export const updateDepositConfig = async (id, data, options = {}) => {
  return update(id, data, options);
};

export const remove = async (id, options = {}) => {
  const { businessId } = options;
  const parsedId = parseInt(id);
  const where = { id: parsedId };
  if (businessId != null) {
    where.businessId = businessId;
  }

  const existing = await prisma.businessService.findFirst({ where });
  if (!existing) {
    const error = new Error("Dịch vụ không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  const bookingCount = await prisma.booking.count({
    where: {
      serviceId: existing.id,
      status: { in: ["pending", "confirmed"] },
    },
  });

  if (bookingCount > 0) {
    const error = new Error(
      "Không thể xóa dịch vụ đang có booking chưa hoàn thành",
    );
    error.statusCode = 400;
    throw error;
  }

  await prisma.businessService.delete({ where: { id: existing.id } });
  return true;
};
