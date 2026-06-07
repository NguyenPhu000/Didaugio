/**
 * Business Profile Service - SRP: Quản lý hồ sơ doanh nghiệp (đăng ký, cập nhật, xem)
 */
import prisma from "../../config/prismaClient.js";
import { BUSINESS_STATUS } from "../../config/constants.js";
import eventEmitter, { EVENTS } from "../../utils/eventEmitter.js";
import {
  serializeBusiness,
  mapBusinessDataToPrisma,
} from "./business.serializer.js";
import { uploadImage } from "../../utils/cloudinaryService.js";

const uploadLegalDocument = async (fileData) => {
  if (!fileData) return null;
  if (fileData.startsWith("http")) return fileData;
  try {
    const file = fileData.startsWith("data:") ? fileData : `data:image/jpeg;base64,${fileData}`;
    const result = await uploadImage(file, { 
      upload_preset: "Didaugio_Secure",
      folder: "didaugio/legal" 
    });
    return result.url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    const err = new Error("Lỗi tải lên tài liệu pháp lý");
    err.statusCode = 500;
    throw err;
  }
};

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
      idCardNumber: serialized.idCardNumberMasked,
      idCardFront: serialized.idCardFront,
      idCardBack: serialized.idCardBack,
      businessLicense: serialized.businessLicense,
      bankName: serialized.bankName,
      bankAccountNumber: serialized.bankAccountNumberMasked,
      bankAccountOwner: serialized.bankAccountOwnerMasked,
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

  if (data.idCardFront) {
    data.idCardFront = await uploadLegalDocument(data.idCardFront);
  }
  if (data.idCardBack) {
    data.idCardBack = await uploadLegalDocument(data.idCardBack);
  }
  if (data.businessLicense) {
    data.businessLicense = await uploadLegalDocument(data.businessLicense);
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
    select: {
      id: true,
      name: true,
      slug: true,
      address: true,
      status: true,
      thumbnail: true,
      latitude: true,
      longitude: true,
      ratingAvg: true,
      ratingCount: true,
      viewCount: true,
      isFeatured: true,
      isVerified: true,
      categoryId: true,
      districtId: true,
      priceRange: true,
      priceFrom: true,
      priceTo: true,
      shortDescription: true,
      phone: true,
      createdBy: true,
      createdAt: true,
      category: { select: { id: true, name: true, icon: true } },
      district: { select: { id: true, name: true } },
      ward: { select: { id: true, name: true } },
      images: {
        select: { id: true, secureUrl: true, thumbnailUrl: true, imageData: true, order: true, isCover: true },
        orderBy: { order: "asc" },
        take: 5,
      },
      business: {
        select: { id: true, businessName: true, status: true },
      },
    },
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

  if (business.status === BUSINESS_STATUS.TERMINATED) {
    const error = new Error(
      "Hợp đồng doanh nghiệp đã chấm dứt. Không thể cập nhật hồ sơ.",
    );
    error.statusCode = 410;
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

  if (data.idCardFront) {
    data.idCardFront = await uploadLegalDocument(data.idCardFront);
  }
  if (data.idCardBack) {
    data.idCardBack = await uploadLegalDocument(data.idCardBack);
  }
  if (data.businessLicense) {
    data.businessLicense = await uploadLegalDocument(data.businessLicense);
  }

  // Rate limit: max 3 document uploads per 24h
  const DOC_UPLOAD_FIELDS = ["idCardFront", "idCardBack", "businessLicense"];
  const hasNewUploads = DOC_UPLOAD_FIELDS.some(
    (f) => data[f] && !data[f].startsWith("http"),
  );

  const prismaData = mapBusinessDataToPrisma(data);

  if (hasNewUploads) {
    const now = new Date();
    const lastUpload = business.lastUploadAt ? new Date(business.lastUploadAt) : null;
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Reset counter if last upload was more than 24h ago
    const currentCount = (lastUpload && lastUpload >= twentyFourHoursAgo)
      ? business.documentUploadCount || 0
      : 0;

    const newCount = currentCount + 1;

    if (newCount > 3) {
      // Flag as SUSPICIOUS — auto-lock
      prismaData.status = BUSINESS_STATUS.SUSPICIOUS;
      prismaData.suspensionReason = "Tải lên tài liệu quá 3 lần trong 24 giờ — có thể hoạt động đáng ngờ";
    }

    prismaData.documentUploadCount = newCount;
    prismaData.lastUploadAt = now;
  }

  const profileData = {
    fullName: data.fullName,
    phone: data.phone,
    address: data.address,
  };
  const hasProfileUpdates = Object.values(profileData).some(
    (value) => value !== undefined,
  );

  // Sensitive fields that trigger re-verification
  const SENSITIVE_FIELDS = [
    "businessName", "businessType", "taxCode",
    "idCardNumber", "idCardFront", "idCardBack",
    "businessLicense", "bankAccountNumber", "bankAccountOwner", "bankName",
  ];

  // Track which sensitive fields actually changed (diff)
  const changedFields = SENSITIVE_FIELDS.filter((field) => {
    if (data[field] === undefined) return false;
    const prismaKey = field === "bankAccountNumber" ? "bankAccount"
      : field === "bankAccountOwner" ? "bankOwner" : field;
    const oldValue = business[prismaKey];
    const newValue = prismaData[prismaKey];
    // Compare: if old was null and new has value, or values differ
    if (newValue === undefined) return false;
    return String(oldValue ?? "") !== String(newValue ?? "");
  });

  const hasVerificationUpdates = changedFields.length > 0;

  // Per-item reset: only reset status if sensitive fields changed, don't reset contract
  if (
    business.status === BUSINESS_STATUS.REJECTED ||
    (hasVerificationUpdates && business.status === BUSINESS_STATUS.APPROVED)
  ) {
    prismaData.status = BUSINESS_STATUS.PENDING;
    prismaData.rejectionReason = null;
    prismaData.approvedBy = null;
    prismaData.approvedAt = null;
    // Don't reset contractSigned — only reset if contract-related fields changed
    // Contract remains valid unless business itself is rejected
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

  // Emit RESUBMITTED if status changed back to PENDING
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

  // Emit DOCUMENT_UPDATED with diff for admin notification
  if (changedFields.length > 0) {
    eventEmitter.emit(EVENTS.BUSINESS.DOCUMENT_UPDATED, {
      businessId: updated.id,
      ownerId: updated.ownerId,
      changedFields,
    });
  }

  return mapProfileResponse(updated);
};

export const signContract = async (userId, payload = {}) => {
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

  // Allow re-signing if contract version is outdated
  const CURRENT_CONTRACT_VERSION = "v1";
  if (business.contractSigned && business.contractVersion === CURRENT_CONTRACT_VERSION) {
    return mapProfileResponse(business);
  }

  const signedAt = payload.signedAt ? new Date(payload.signedAt) : new Date();

  if (Number.isNaN(signedAt.getTime())) {
    const error = new Error("Thời gian ký hợp đồng không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  const signerMetadata = {
    ...(payload.signerMetadata || {}),
    signatureData: payload.signatureData,
  };

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      contractSigned: true,
      contractSignedAt: signedAt,
      contractVersion: payload.contractVersion || "v1",
      signerMetadata,
    },
    include: defaultInclude,
  });

  eventEmitter.emit(EVENTS.BUSINESS.CONTRACT_SIGNED, {
    businessId: updated.id,
    businessName: updated.businessName,
    ownerId: userId,
    contractVersion: updated.contractVersion,
    signedAt: updated.contractSignedAt,
  });

  return mapProfileResponse(updated);
};
