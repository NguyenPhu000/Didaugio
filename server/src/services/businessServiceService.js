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

const serializeService = (service) => {
  if (!service) return null;

  return {
    ...service,
    discountPrice: service.salePrice ?? null,
    duration: service.durationMinutes ?? null,
  };
};

const mapServiceInputToPrisma = (data = {}) => {
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
    data: data.map(serializeService),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getById = async (id) => {
  const service = await prisma.businessService.findUnique({
    where: { id: parseInt(id) },
    include: {
      ...defaultInclude,
      business: { select: { id: true, businessName: true } },
    },
  });

  if (!service) {
    const error = new Error("Dịch vụ không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  return serializeService(service);
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

  const mappedData = mapServiceInputToPrisma(data);

  let placeId = mappedData.placeId;

  if (!placeId) {
    const firstPlace = await prisma.place.findFirst({
      where: {
        businessId: business.id,
        deletedAt: null,
      },
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
  }

  delete mappedData.placeId;

  const service = await prisma.businessService.create({
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

  return serializeService(service);
};

export const update = async (id, data) => {
  const mappedData = mapServiceInputToPrisma(data);

  const placeId = mappedData.placeId;
  if (placeId) {
    mappedData.place = {
      connect: { id: placeId },
    };
  }
  delete mappedData.placeId;

  const service = await prisma.businessService.update({
    where: { id: parseInt(id) },
    data: mappedData,
    include: defaultInclude,
  });

  return serializeService(service);
};

export const remove = async (id) => {
  const bookingCount = await prisma.booking.count({
    where: {
      serviceId: parseInt(id),
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

  await prisma.businessService.delete({ where: { id: parseInt(id) } });
  return true;
};
