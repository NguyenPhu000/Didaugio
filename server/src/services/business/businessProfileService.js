/**
 * Business Profile Service - SRP: Quản lý hồ sơ doanh nghiệp (đăng ký, cập nhật, xem)
 */
import prisma from "../../config/prismaClient.js";
import { BUSINESS_STATUS } from "../../config/constants.js";
import eventEmitter, { EVENTS } from "../../utils/eventEmitter.js";
import {
  serializeBusiness,
  mapBusinessDataToPrisma,
} from "./businessSerializer.js";

const defaultInclude = {
  owner: {
    select: {
      id: true,
      email: true,
      status: true,
      lastLoginAt: true,
      profile: {
        select: {
          fullName: true,
          phone: true,
          avatar: true,
          address: true,
        },
      },
    },
  },
};

const getMonthRange = () => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { monthStart, nextMonthStart, now };
};

const mapProfileResponse = async (business) => {
  const serialized = serializeBusiness(business);
  const { monthStart, nextMonthStart, now } = getMonthRange();

  const [
    activePlaces,
    activeServices,
    monthlyBookings,
    monthlyRevenue,
    activeVouchers,
    ratingAgg,
  ] = await Promise.all([
    prisma.place.count({
      where: {
        businessId: business.id,
        status: "approved",
        deletedAt: null,
      },
    }),
    prisma.businessService.count({
      where: { businessId: business.id, isActive: true },
    }),
    prisma.booking.count({
      where: {
        service: { businessId: business.id },
        createdAt: { gte: monthStart, lt: nextMonthStart },
      },
    }),
    prisma.booking.aggregate({
      where: {
        service: { businessId: business.id },
        status: "completed",
        createdAt: { gte: monthStart, lt: nextMonthStart },
      },
      _sum: { finalPrice: true },
    }),
    prisma.voucher.count({
      where: {
        businessId: business.id,
        isActive: true,
        endDate: { gt: now },
      },
    }),
    prisma.place.aggregate({
      where: { businessId: business.id, deletedAt: null },
      _avg: { ratingAvg: true },
    }),
  ]);

  const ownerInfo = {
    id: business.owner.id,
    email: business.owner.email,
    status: business.owner.status,
    lastLoginAt: business.owner.lastLoginAt,
    fullName: business.owner.profile?.fullName ?? null,
    phone: business.owner.profile?.phone ?? null,
    avatar: business.owner.profile?.avatar ?? null,
    address: business.owner.profile?.address ?? null,
  };

  const stats = {
    activePlaces,
    activeServices,
    monthlyBookings,
    monthlyRevenue: Number(monthlyRevenue?._sum?.finalPrice || 0),
    activeVouchers,
    averageRating: Number(ratingAgg?._avg?.ratingAvg || 0),
  };

  return {
    ...serialized,
    businessInfo: {
      businessName: serialized.businessName,
      businessType: serialized.businessType,
      taxCode: serialized.taxCode,
      idCardNumber: serialized.idCardNumber,
      idCardFront: serialized.idCardFront,
      idCardBack: serialized.idCardBack,
      businessLicense: serialized.businessLicense,
      bankName: serialized.bankName,
      bankAccountNumber: serialized.bankAccountNumber,
      bankAccountOwner: serialized.bankAccountOwner,
      commissionRate: serialized.commissionRate,
      contractSigned: serialized.contractSigned,
      status: serialized.status,
      rejectionReason: serialized.rejectionReason,
      approvedBy: serialized.approvedBy,
      approvedAt: serialized.approvedAt,
    },
    ownerInfo,
    stats,
    verificationStatus: serialized.status,
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

  return mapProfileResponse(business);
};

export const register = async (data, userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, emailVerified: true, status: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    const error = new Error("Người dùng không tồn tại hoặc đã bị xóa");
    error.statusCode = 404;
    throw error;
  }

  if (!user.emailVerified) {
    const error = new Error(
      "Vui lòng xác thực email trước khi đăng ký doanh nghiệp",
    );
    error.statusCode = 422;
    throw error;
  }

  if (user.status !== "active") {
    const error = new Error("Tài khoản hiện không ở trạng thái hoạt động");
    error.statusCode = 422;
    throw error;
  }

  const existing = await prisma.business.findUnique({
    where: { ownerId: userId },
  });

  if (existing) {
    const error = new Error("Bạn đã có hồ sơ doanh nghiệp");
    error.statusCode = 400;
    throw error;
  }

  const prismaData = mapBusinessDataToPrisma(data);
  const profileData = {
    fullName: data.fullName,
    phone: data.phone,
    address: data.address,
  };
  const hasProfileUpdates = Object.values(profileData).some(
    (value) => value !== undefined,
  );

  const business = await prisma.$transaction(async (tx) => {
    if (hasProfileUpdates) {
      await tx.userProfile.upsert({
        where: { userId },
        update: profileData,
        create: { userId, ...profileData },
      });
    }

    return tx.business.create({
      data: {
        ...prismaData,
        ownerId: userId,
        status: BUSINESS_STATUS.PENDING,
      },
      include: defaultInclude,
    });
  });

  const serialized = await mapProfileResponse(business);

  eventEmitter.emit(EVENTS.BUSINESS.REGISTERED, {
    businessId: business.id,
    userId,
    businessName: business.businessName,
  });

  return serialized;
};

export const getMyPlaces = async (userId) => {
  const business = await prisma.business.findUnique({
    where: { ownerId: userId },
    select: { id: true },
  });

  const where = {
    deletedAt: null,
    OR: [{ createdBy: userId }],
  };
  if (business) {
    where.OR.push({ businessId: business.id });
  }

  const places = await prisma.place.findMany({
    where,
    select: { id: true, name: true, address: true },
    orderBy: { name: "asc" },
  });

  return places;
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

  if (business.status === BUSINESS_STATUS.SUSPENDED) {
    const error = new Error(
      "Hồ sơ doanh nghiệp đang bị tạm ngưng và không thể cập nhật",
    );
    error.statusCode = 422;
    throw error;
  }

  if (
    data.bankAccountNumber != null &&
    data.bankAccountNumber !== "" &&
    !/^\d{6,30}$/.test(String(data.bankAccountNumber))
  ) {
    const error = new Error("Số tài khoản không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  const prismaData = mapBusinessDataToPrisma(data);
  const profileData = {
    fullName: data.fullName,
    phone: data.phone,
    address: data.address,
  };
  const hasProfileUpdates = Object.values(profileData).some(
    (value) => value !== undefined,
  );
  const hasVerificationUpdates =
    data.businessName !== undefined ||
    data.businessType !== undefined ||
    data.taxCode !== undefined ||
    data.idCardNumber !== undefined ||
    data.idCardFront !== undefined ||
    data.idCardBack !== undefined ||
    data.businessLicense !== undefined;

  if (
    business.status === BUSINESS_STATUS.REJECTED ||
    (hasVerificationUpdates && business.status !== BUSINESS_STATUS.PENDING)
  ) {
    prismaData.status = BUSINESS_STATUS.PENDING;
    prismaData.rejectionReason = null;
    prismaData.approvedBy = null;
    prismaData.approvedAt = null;
    prismaData.contractSigned = false;
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (hasProfileUpdates) {
      await tx.userProfile.upsert({
        where: { userId },
        update: profileData,
        create: { userId, ...profileData },
      });
    }

    return tx.business.update({
      where: { id: business.id },
      data: prismaData,
      include: defaultInclude,
    });
  });

  if (
    business.status !== BUSINESS_STATUS.PENDING &&
    updated.status === BUSINESS_STATUS.PENDING
  ) {
    eventEmitter.emit(EVENTS.BUSINESS.RESUBMITTED, {
      businessId: updated.id,
      ownerId: updated.ownerId,
      businessName: updated.businessName,
    });
  }

  return mapProfileResponse(updated);
};

export const signContract = async (userId) => {
  const business = await prisma.business.findUnique({
    where: { ownerId: userId },
    include: defaultInclude,
  });

  if (!business) {
    const error = new Error("Bạn chưa đăng ký doanh nghiệp");
    error.statusCode = 404;
    throw error;
  }

  if (business.status !== BUSINESS_STATUS.APPROVED) {
    const error = new Error("Chỉ doanh nghiệp đã duyệt mới được ký hợp đồng");
    error.statusCode = 422;
    throw error;
  }

  if (business.contractSigned) {
    return mapProfileResponse(business);
  }

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: { contractSigned: true },
    include: defaultInclude,
  });

  return mapProfileResponse(updated);
};
