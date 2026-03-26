/**
 * Business Offering Service - CRUD dịch vụ/sản phẩm mà doanh nghiệp cung cấp
 * (Entity: BusinessService trong Prisma)
 */
import prisma from "../config/prismaClient.js";
import { PAGINATION, ROLES } from "../config/constants.js";

const defaultInclude = {
  place: { select: { id: true, name: true } },
  _count: { select: { bookings: true } },
};

const toIntOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const serializeOffering = (offering) => {
  if (!offering) return null;

  const normalizedImages = Array.isArray(offering.images)
    ? offering.images.filter((item) => typeof item === "string")
    : [];

  return {
    ...offering,
    discountPrice: offering.salePrice ?? null,
    duration: offering.durationMinutes ?? null,
    thumbnail: offering.thumbnail ?? null,
    images: normalizedImages,
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

  const mappedData = mapInputToPrisma(data);

  let placeId = mappedData.placeId;

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

  delete mappedData.placeId;

  const offering = await prisma.businessService.create({
    data: {
      ...mappedData,
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

  const placeId = mappedData.placeId;
  if (placeId) {
    mappedData.place = {
      connect: { id: placeId },
    };
  }
  delete mappedData.placeId;

  const offering = await prisma.businessService.update({
    where: { id: existing.id },
    data: mappedData,
    include: defaultInclude,
  });

  return serializeOffering(offering);
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
