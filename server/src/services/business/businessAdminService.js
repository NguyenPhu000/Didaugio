/**
 * Business Admin Service - SRP: Quản lý danh sách & duyệt/từ chối doanh nghiệp (Admin)
 */
import prisma from "../../config/prismaClient.js";
import { PAGINATION, BUSINESS_STATUS, ROLES } from "../../config/constants.js";
import eventEmitter, { EVENTS } from "../../utils/eventEmitter.js";
import { serializeBusiness } from "./businessSerializer.js";

const defaultInclude = {
  owner: {
    select: {
      id: true,
      email: true,
      profile: { select: { fullName: true } },
    },
  },
};

const adminListSelect = {
  id: true,
  ownerId: true,
  businessName: true,
  businessType: true,
  taxCode: true,
  idCardNumber: true,
  bankName: true,
  bankAccount: true,
  bankOwner: true,
  contractSigned: true,
  commissionRate: true,
  status: true,
  rejectionReason: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  owner: defaultInclude.owner,
  _count: { select: { places: true, services: true } },
};

const ensurePendingForReview = (business) => {
  if (business.status !== BUSINESS_STATUS.PENDING) {
    const error = new Error("Hồ sơ đã được xử lý, không thể duyệt lại");
    error.statusCode = 422;
    throw error;
  }
};

const ensureApprovedForSuspend = (business) => {
  if (business.status !== BUSINESS_STATUS.APPROVED) {
    const error = new Error(
      "Chỉ doanh nghiệp đã duyệt mới có thể bị tạm ngưng",
    );
    error.statusCode = 422;
    throw error;
  }
};

const ensureSuspendedForReactivate = (business) => {
  if (business.status !== BUSINESS_STATUS.SUSPENDED) {
    const error = new Error(
      "Chỉ doanh nghiệp đang tạm ngưng mới có thể kích hoạt lại",
    );
    error.statusCode = 422;
    throw error;
  }
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
  if (params.contractSigned !== undefined) {
    where.contractSigned = params.contractSigned;
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
      select: adminListSelect,
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
  const businessToReview = await prisma.business.findUnique({
    where: { id: parseInt(id) },
    select: { id: true, status: true },
  });

  if (!businessToReview) {
    const error = new Error("Doanh nghiệp không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  ensurePendingForReview(businessToReview);

  const updateData = {
    status: BUSINESS_STATUS.APPROVED,
    approvedAt: new Date(),
    rejectionReason: null,
  };
  if (approvedBy != null) {
    updateData.approvedBy = approvedBy;
  }
  if (data.commissionRate != null && data.commissionRate !== "") {
    updateData.commissionRate = Number(data.commissionRate);
  }
  const business = await prisma.$transaction(async (tx) => {
    const updatedBusiness = await tx.business.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: defaultInclude,
    });

    await tx.user.updateMany({
      where: {
        id: updatedBusiness.ownerId,
        roleId: { gt: ROLES.BUSINESS },
      },
      data: { roleId: ROLES.BUSINESS },
    });

    return updatedBusiness;
  });

  eventEmitter.emit(EVENTS.BUSINESS.APPROVED, {
    businessId: business.id,
    approvedBy,
    ownerId: business.ownerId,
  });

  return serializeBusiness(business);
};

export const reject = async (id, rejectionReason, rejectedBy) => {
  const businessToReview = await prisma.business.findUnique({
    where: { id: parseInt(id) },
    select: { id: true, status: true },
  });

  if (!businessToReview) {
    const error = new Error("Doanh nghiệp không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  ensurePendingForReview(businessToReview);

  const business = await prisma.business.update({
    where: { id: parseInt(id) },
    data: {
      status: BUSINESS_STATUS.REJECTED,
      rejectionReason,
      approvedBy: null,
      approvedAt: null,
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

export const suspend = async (id, suspendedBy) => {
  const businessToReview = await prisma.business.findUnique({
    where: { id: parseInt(id) },
    select: { id: true, status: true },
  });

  if (!businessToReview) {
    const error = new Error("Doanh nghiệp không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  ensureApprovedForSuspend(businessToReview);

  const business = await prisma.business.update({
    where: { id: parseInt(id) },
    data: {
      status: BUSINESS_STATUS.SUSPENDED,
      approvedBy: suspendedBy ?? null,
      approvedAt: new Date(),
    },
    include: defaultInclude,
  });

  return serializeBusiness(business);
};

export const reactivate = async (id, reactivatedBy) => {
  const businessToReview = await prisma.business.findUnique({
    where: { id: parseInt(id) },
    select: { id: true, status: true },
  });

  if (!businessToReview) {
    const error = new Error("Doanh nghiệp không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  ensureSuspendedForReactivate(businessToReview);

  const business = await prisma.business.update({
    where: { id: parseInt(id) },
    data: {
      status: BUSINESS_STATUS.APPROVED,
      approvedBy: reactivatedBy ?? null,
      approvedAt: new Date(),
    },
    include: defaultInclude,
  });

  return serializeBusiness(business);
};
