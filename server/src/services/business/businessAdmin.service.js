/**
 * Business Admin Service - SRP: Quản lý danh sách & duyệt/từ chối doanh nghiệp (Admin)
 */
import prisma from "../../config/prismaClient.js";
import { PAGINATION, BUSINESS_STATUS, ROLES, BOOKING_STATUS, PAYMENT_STATUS } from "../../config/constants.js";
import eventEmitter, { EVENTS } from "../../utils/eventEmitter.js";
import { serializeBusiness } from "./business.serializer.js";
import { sanitizeText } from "../../utils/sanitizeText.js";
import { decryptField, isEncrypted } from "../../utils/fieldEncryption.js";

const defaultInclude = {
  owner: {
    select: {
      id: true,
      email: true,
      profile: { select: { fullName: true, phone: true, address: true } },
    },
  },
};

const adminListSelect = {
  id: true,
  ownerId: true,
  businessName: true,
  businessType: true,
  taxCode: true,
  bankName: true,
  bankAccount: true,
  bankOwner: true,
  idCardNumber: true,
  contractSigned: true,
  commissionRate: true,
  status: true,
  rejectionReason: true,
  suspensionReason: true,
  terminationReason: true,
  terminatedAt: true,
  documentUploadCount: true,
  lastUploadAt: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  owner: defaultInclude.owner,
  sensitiveDocuments: { select: { type: true } },
  _count: { select: { places: true, services: true, vouchers: true } },
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
  if (business.status !== BUSINESS_STATUS.SUSPENDED && business.status !== BUSINESS_STATUS.SUSPICIOUS) {
    const error = new Error(
      "Chỉ doanh nghiệp đang tạm ngưng hoặc bị đánh dấu đáng ngờ mới có thể kích hoạt lại",
    );
    error.statusCode = 422;
    throw error;
  }
};

/**
 * Giải mã field nếu đã mã hóa, trả về giá trị plain text.
 * Trả null nếu value null/undefined.
 */
const tryDecrypt = (value) => {
  if (value == null) return null;
  if (isEncrypted(value)) {
    try {
      return decryptField(value);
    } catch {
      return null;
    }
  }
  return String(value);
};

/**
 * Mask CCCD: giữ 4 ký tự cuối
 */
const maskIdCard = (value) => {
  const plain = tryDecrypt(value);
  if (!plain || plain.length < 4) return null;
  return `${"*".repeat(plain.length - 4)}${plain.slice(-4)}`;
};

/** Gắn số đặt chỗ theo từng business (qua business_services) — không gồm số tiền/doanh thu. */
const attachBookingCounts = async (rows) => {
  if (!rows?.length) return rows;
  const ids = rows.map((b) => b.id);
  const grouped = await prisma.booking.groupBy({
    by: ["serviceId"],
    where: { service: { businessId: { in: ids } } },
    _count: { _all: true },
  });
  if (!grouped.length) {
    return rows.map((b) => ({
      ...b,
      _count: { ...b._count, bookings: 0 },
    }));
  }
  const serviceIds = grouped.map((r) => r.serviceId);
  const services = await prisma.businessService.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, businessId: true },
  });
  const serviceToBusiness = new Map(services.map((s) => [s.id, s.businessId]));
  const byBusiness = new Map();
  for (const row of grouped) {
    const bid = serviceToBusiness.get(row.serviceId);
    if (bid == null) continue;
    byBusiness.set(bid, (byBusiness.get(bid) || 0) + row._count._all);
  }
  return rows.map((b) => ({
    ...b,
    _count: {
      ...b._count,
      bookings: byBusiness.get(b.id) || 0,
    },
  }));
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

  /** Cùng bộ lọc tìm kiếm / hợp đồng, bỏ lọc trạng thái — để thống kê 4 thẻ luôn đầy đủ */
  const summaryWhere = { ...where };
  delete summaryWhere.status;

  const [
    rawData,
    total,
    statusGroups,
    totalInSummary,
    totalPlacesSummary,
    approvedWithoutContract,
  ] = await Promise.all([
    prisma.business.findMany({
      where,
      select: adminListSelect,
      skip,
      take: limit,
      orderBy,
    }),
    prisma.business.count({ where }),
    prisma.business.groupBy({
      by: ["status"],
      where: summaryWhere,
      _count: { _all: true },
    }),
    prisma.business.count({ where: summaryWhere }),
    prisma.place.count({
      where: {
        deletedAt: null,
        businessId: { not: null },
        business: { is: summaryWhere },
      },
    }),
    prisma.business.count({
      where: {
        ...summaryWhere,
        status: BUSINESS_STATUS.APPROVED,
        contractSigned: false,
      },
    }),
  ]);

  const byStatus = Object.fromEntries(
    statusGroups.map((g) => [g.status, g._count._all]),
  );

  const summary = {
    totalBusinesses: totalInSummary,
    pending: byStatus.pending ?? 0,
    approved: byStatus.approved ?? 0,
    rejected: byStatus.rejected ?? 0,
    suspended: byStatus.suspended ?? 0,
    approvedWithoutContract: approvedWithoutContract ?? 0,
    totalPlaces: totalPlacesSummary,
  };

  const withCounts = await attachBookingCounts(rawData);
  const data = withCounts.map(serializeBusiness);

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    summary,
  };
};

export const getById = async (id) => {
  const idNum = parseInt(id, 10);
  const now = new Date();
  const [
    business,
    bookingCount,
    bookingAggregate,
    completedAggregate,
    bookingStatusGroups,
    paymentStatusGroups,
    activeServiceCount,
    inactiveServiceCount,
    activeVoucherCount,
    expiredVoucherCount,
    placeStatusGroups,
  ] = await Promise.all([
    prisma.business.findUnique({
      where: { id: idNum },
      include: {
        ...defaultInclude,
        _count: { select: { places: true, services: true, vouchers: true } },
        sensitiveDocuments: { select: { type: true } },
        places: {
          orderBy: [{ updatedAt: "desc" }],
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            address: true,
            district: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.booking.count({
      where: { service: { businessId: idNum } },
    }),
    prisma.booking.aggregate({
      where: { businessId: idNum, deletedAt: null },
      _sum: {
        originalPrice: true,
        discountAmount: true,
        finalPrice: true,
        commissionAmount: true,
      },
      _count: { _all: true },
    }),
    prisma.booking.aggregate({
      where: { businessId: idNum, deletedAt: null, status: "completed" },
      _sum: { finalPrice: true, commissionAmount: true },
      _count: { _all: true },
    }),
    prisma.booking.groupBy({
      by: ["status"],
      where: { businessId: idNum, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.booking.groupBy({
      by: ["paymentStatus"],
      where: { businessId: idNum, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.businessService.count({
      where: { businessId: idNum, isActive: true },
    }),
    prisma.businessService.count({
      where: { businessId: idNum, isActive: false },
    }),
    prisma.voucher.count({
      where: {
        businessId: idNum,
        isActive: true,
        endDate: { gte: now },
      },
    }),
    prisma.voucher.count({
      where: { businessId: idNum, endDate: { lt: now } },
    }),
    prisma.place.groupBy({
      by: ["status"],
      where: { businessId: idNum, deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  if (!business) {
    const error = new Error("Doanh nghiệp không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  const toCountMap = (groups = [], key) =>
    Object.fromEntries(groups.map((row) => [row[key], row._count._all]));

  const bookingByStatus = toCountMap(bookingStatusGroups, "status");
  const paymentByStatus = toCountMap(paymentStatusGroups, "paymentStatus");
  const placeByStatus = toCountMap(placeStatusGroups, "status");

  const sumOriginal = bookingAggregate?._sum?.originalPrice ?? 0;
  const sumDiscount = bookingAggregate?._sum?.discountAmount ?? 0;
  const sumFinal = bookingAggregate?._sum?.finalPrice ?? 0;
  const sumCommission = bookingAggregate?._sum?.commissionAmount ?? 0;

  const completedFinal = completedAggregate?._sum?.finalPrice ?? 0;
  const completedCommission = completedAggregate?._sum?.commissionAmount ?? 0;
  const completedNet = completedFinal - completedCommission;
  const completedCommissionPct =
    completedFinal > 0
      ? Number(((completedCommission / completedFinal) * 100).toFixed(2))
      : 0;

  const docTypes = new Set((business.sensitiveDocuments ?? []).map((d) => d.type));

  const complianceChecklist = {
    hasTaxCode: Boolean(business.taxCode),
    hasIdCardFront: docTypes.has("id_card_front"),
    hasIdCardBack: docTypes.has("id_card_back"),
    hasBusinessLicense: docTypes.has("business_license"),
    hasBankInfo: Boolean(
      business.bankName && business.bankAccount && business.bankOwner,
    ),
    hasSignedContract: Boolean(business.contractSigned),
    hasCommissionRate: business.commissionRate != null,
  };

  const riskFlags = [];
  if (
    !complianceChecklist.hasSignedContract &&
    business.status === BUSINESS_STATUS.APPROVED
  ) {
    riskFlags.push("Doanh nghiệp đã duyệt nhưng chưa ký hợp đồng");
  }
  if (!complianceChecklist.hasBusinessLicense) {
    riskFlags.push("Thiếu giấy phép kinh doanh");
  }
  if (!complianceChecklist.hasBankInfo) {
    riskFlags.push("Thiếu thông tin ngân hàng đầy đủ");
  }
  if ((paymentByStatus.unpaid ?? 0) > 0) {
    riskFlags.push("Có booking chưa thanh toán");
  }

  const serialized = serializeBusiness(
    {
      ...business,
      _count: { ...business._count, bookings: bookingCount },
    },
    { decryptSensitive: true, includeDocumentUrls: true },
  );

  return {
    ...serialized,
    adminInsights: {
      financialSummary: {
        totalBookings: bookingAggregate?._count?._all ?? 0,
        totalOriginalRevenue: sumOriginal,
        totalDiscount: sumDiscount,
        totalFinalRevenue: sumFinal,
        totalCommission: sumCommission,
        totalNetRevenue: sumFinal - sumCommission,
        completedBookings: completedAggregate?._count?._all ?? 0,
        completedRevenue: completedFinal,
        completedCommission,
        completedNetRevenue: completedNet,
        completedCommissionSharePct: completedCommissionPct,
      },
      contractSummary: {
        contractSigned: Boolean(business.contractSigned),
        contractSignedAt: business.contractSignedAt,
        contractVersion: business.contractVersion,
        signerMetadata: business.signerMetadata ?? null,
        commissionRate: serialized.commissionRate,
      },
      operationsSummary: {
        activeServiceCount,
        inactiveServiceCount,
        activeVoucherCount,
        expiredVoucherCount,
        placeStatusCounts: placeByStatus,
      },
      bookingStatusCounts: bookingByStatus,
      paymentStatusCounts: paymentByStatus,
      complianceChecklist,
      riskFlags,
    },
  };
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

    // Auto-set places from HIDDEN to APPROVED when business approved (KYC unlock)
    await tx.place.updateMany({
      where: { businessId: parseInt(id), status: "hidden", deletedAt: null },
      data: { status: "approved" },
    });

    return updatedBusiness;
  });

  const approvedEventPayload = {
    businessId: business.id,
    approvedBy,
    ownerId: business.ownerId,
    // Dữ liệu cho contract generation (background listener)
    id: business.id,
    businessName: business.businessName,
    businessType: business.businessType,
    taxCode: tryDecrypt(business.taxCode),
    ownerName: business.owner?.profile?.fullName ?? null,
    idCardNumberMasked: maskIdCard(business.idCardNumber),
    commissionRate: business.commissionRate != null ? Number(business.commissionRate) : 10,
    address: business.owner?.profile?.address ?? null,
  };

  eventEmitter.emit(EVENTS.BUSINESS.APPROVED, approvedEventPayload);

  return serializeBusiness(business);
};

export const reject = async (id, rejectionReason, rejectedBy) => {
  const sanitizedReason = sanitizeText(rejectionReason);

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
      rejectionReason: sanitizedReason,
      approvedBy: null,
      approvedAt: null,
    },
    include: defaultInclude,
  });

  eventEmitter.emit(EVENTS.BUSINESS.REJECTED, {
    businessId: business.id,
    rejectedBy,
    reason: sanitizedReason,
    ownerId: business.ownerId,
  });

  return serializeBusiness(business);
};

export const suspend = async (id, suspensionReason, suspendedBy) => {
  const sanitizedReason = sanitizeText(suspensionReason);
  if (!sanitizedReason || sanitizedReason.length < 10) {
    const error = new Error("Lý do tạm khóa phải có ít nhất 10 ký tự");
    error.statusCode = 400;
    throw error;
  }

  const businessToReview = await prisma.business.findUnique({
    where: { id: parseInt(id) },
    select: { id: true, status: true, ownerId: true },
  });

  if (!businessToReview) {
    const error = new Error("Doanh nghiệp không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  ensureApprovedForSuspend(businessToReview);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update business status
    const business = await tx.business.update({
      where: { id: parseInt(id) },
      data: {
        status: BUSINESS_STATUS.SUSPENDED,
        suspensionReason: sanitizedReason,
        approvedBy: suspendedBy ?? null,
        approvedAt: new Date(),
      },
      include: defaultInclude,
    });

    // 2. Cascade: Set all places to HIDDEN (not visible to customers)
    await tx.place.updateMany({
      where: { businessId: parseInt(id), deletedAt: null },
      data: { status: "hidden" },
    });

    // 3. Find affected bookings (PENDING or CONFIRMED, not yet completed/cancelled)
    const affectedBookings = await tx.booking.findMany({
      where: {
        businessId: parseInt(id),
        status: { in: [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED] },
        deletedAt: null,
      },
      include: { payment: true },
    });

    const bookingIdsToCancel = [];
    const refundsToProcess = [];

    for (const booking of affectedBookings) {
      const useDateTime = new Date(booking.useDate);
      if (booking.useTime) {
        const [hours, minutes] = booking.useTime.split(":");
        useDateTime.setHours(parseInt(hours), parseInt(minutes));
      } else {
        useDateTime.setHours(23, 59, 59);
      }

      // If booking time has passed, just cancel without refund
      const now = new Date();
      if (useDateTime < now) {
        bookingIdsToCancel.push(booking.id);
      } else {
        // Booking in future: cancel + refund 100%
        bookingIdsToCancel.push(booking.id);
        if (booking.payment && booking.payment.status === PAYMENT_STATUS.PAID) {
          refundsToProcess.push({
            bookingId: booking.id,
            amount: booking.payment.amount,
            paymentId: booking.payment.id,
          });
        }
      }
    }

    // 4. Cancel bookings
    if (bookingIdsToCancel.length > 0) {
      await tx.booking.updateMany({
        where: { id: { in: bookingIdsToCancel } },
        data: {
          status: BOOKING_STATUS.CANCELLED,
          cancelReason: `Doanh nghiệp bị tạm khóa: ${sanitizedReason.substring(0, 100)}`,
          cancelledBy: String(suspendedBy || "system"),
          cancelledAt: new Date(),
        },
      });

      // Create action logs
      for (const bid of bookingIdsToCancel) {
        await tx.bookingActionLog.create({
          data: {
            bookingId: bid,
            action: "auto_cancel_suspension",
            actorUserId: suspendedBy,
            metadata: { reason: sanitizedReason },
          },
        });
      }
    }

    // 5. Process refunds (mark as fully refunded)
    for (const refund of refundsToProcess) {
      await tx.payment.update({
        where: { id: refund.paymentId },
        data: {
          status: "fully_refunded",
          refundAmount: refund.amount,
          refundedAt: new Date(),
          refundReason: `Hoàn tiền do DN bị tạm khóa: ${sanitizedReason.substring(0, 100)}`,
        },
      });
    }

    return { business, cancelledCount: bookingIdsToCancel.length, refundCount: refundsToProcess.length };
  });

  eventEmitter.emit(EVENTS.BUSINESS.SUSPENDED, {
    businessId: result.business.id,
    suspendedBy,
    reason: sanitizedReason,
    ownerId: result.business.ownerId,
    cancelledBookings: result.cancelledCount,
    refundedBookings: result.refundCount,
  });

  return serializeBusiness(result.business);
};

export const reactivate = async (id, reactivatedBy) => {
  const businessToReview = await prisma.business.findUnique({
    where: { id: parseInt(id) },
    select: { id: true, status: true, ownerId: true },
  });

  if (!businessToReview) {
    const error = new Error("Doanh nghiệp không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  ensureSuspendedForReactivate(businessToReview);

  const business = await prisma.$transaction(async (tx) => {
    // 1. Update business status
    const updated = await tx.business.update({
      where: { id: parseInt(id) },
      data: {
        status: BUSINESS_STATUS.APPROVED,
        suspensionReason: null,
        approvedBy: reactivatedBy ?? null,
        approvedAt: new Date(),
      },
      include: defaultInclude,
    });

    // 2. Restore places from hidden to approved (they were hidden during suspension)
    await tx.place.updateMany({
      where: { businessId: parseInt(id), status: "hidden", deletedAt: null },
      data: { status: "approved" },
    });

    return updated;
  });

  eventEmitter.emit(EVENTS.BUSINESS.REACTIVATED, {
    businessId: business.id,
    reactivatedBy,
    ownerId: business.ownerId,
  });

  return serializeBusiness(business);
};

const ensureApprovedOrSuspendedForTerminate = (business) => {
  if (
    business.status !== BUSINESS_STATUS.APPROVED &&
    business.status !== BUSINESS_STATUS.SUSPENDED
  ) {
    const error = new Error(
      "Chỉ doanh nghiệp đã duyệt hoặc đang tạm ngưng mới có thể chấm dứt hợp đồng",
    );
    error.statusCode = 422;
    throw error;
  }
};

export const terminate = async (id, terminationReason, terminatedBy) => {
  const sanitizedReason = sanitizeText(terminationReason);
  if (!sanitizedReason || sanitizedReason.length < 10) {
    const error = new Error("Lý do chấm dứt hợp đồng phải có ít nhất 10 ký tự");
    error.statusCode = 400;
    throw error;
  }

  const businessToReview = await prisma.business.findUnique({
    where: { id: parseInt(id) },
    select: { id: true, status: true, ownerId: true },
  });

  if (!businessToReview) {
    const error = new Error("Doanh nghiệp không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  ensureApprovedOrSuspendedForTerminate(businessToReview);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update business to TERMINATED (read-only archive)
    const business = await tx.business.update({
      where: { id: parseInt(id) },
      data: {
        status: BUSINESS_STATUS.TERMINATED,
        terminationReason: sanitizedReason,
        terminatedAt: new Date(),
        suspensionReason: null,
        approvedBy: terminatedBy ?? null,
      },
      include: defaultInclude,
    });

    // 2. Cascade: Hide all places permanently
    await tx.place.updateMany({
      where: { businessId: parseInt(id), deletedAt: null },
      data: { status: "hidden" },
    });

    // 3. Soft delete all services (mark as inactive)
    await tx.businessService.updateMany({
      where: { businessId: parseInt(id), isActive: true },
      data: { isActive: false },
    });

    // 4. Deactivate all vouchers
    await tx.voucher.updateMany({
      where: { businessId: parseInt(id), isActive: true },
      data: { isActive: false },
    });

    // 5. Cancel ALL bookings (not just pending/confirmed - ALL active ones)
    const affectedBookings = await tx.booking.findMany({
      where: {
        businessId: parseInt(id),
        status: {
          notIn: [
            BOOKING_STATUS.CANCELLED,
            BOOKING_STATUS.REJECTED,
            BOOKING_STATUS.EXPIRED,
            BOOKING_STATUS.NO_SHOW,
            BOOKING_STATUS.COMPLETED,
          ],
        },
        deletedAt: null,
      },
      include: { payment: true },
    });

    const bookingIdsToCancel = affectedBookings.map((b) => b.id);
    const refundsToProcess = affectedBookings
      .filter((b) => b.payment && b.payment.status === PAYMENT_STATUS.PAID)
      .map((b) => ({
        paymentId: b.payment.id,
        amount: b.payment.amount,
        bookingId: b.id,
      }));

    if (bookingIdsToCancel.length > 0) {
      await tx.booking.updateMany({
        where: { id: { in: bookingIdsToCancel } },
        data: {
          status: BOOKING_STATUS.CANCELLED,
          cancelReason: `Hợp đồng doanh nghiệp bị chấm dứt: ${sanitizedReason.substring(0, 100)}`,
          cancelledBy: String(terminatedBy || "system"),
          cancelledAt: new Date(),
        },
      });

      for (const bid of bookingIdsToCancel) {
        await tx.bookingActionLog.create({
          data: {
            bookingId: bid,
            action: "auto_cancel_termination",
            actorUserId: terminatedBy,
            metadata: { reason: sanitizedReason },
          },
        });
      }
    }

    // 6. Full refund for all paid bookings
    for (const refund of refundsToProcess) {
      await tx.payment.update({
        where: { id: refund.paymentId },
        data: {
          status: "fully_refunded",
          refundAmount: refund.amount,
          refundedAt: new Date(),
          refundReason: `Hoàn tiền do chấm dứt hợp đồng DN: ${sanitizedReason.substring(0, 100)}`,
        },
      });
    }

    // 7. Revoke business role from owner (downgrade to regular user)
    await tx.user.updateMany({
      where: { id: business.ownerId, roleId: ROLES.BUSINESS },
      data: { roleId: ROLES.USER },
    });

    return {
      business,
      cancelledCount: bookingIdsToCancel.length,
      refundCount: refundsToProcess.length,
    };
  });

  eventEmitter.emit(EVENTS.BUSINESS.TERMINATED, {
    businessId: result.business.id,
    terminatedBy,
    reason: sanitizedReason,
    ownerId: result.business.ownerId,
    cancelledBookings: result.cancelledCount,
    refundedBookings: result.refundCount,
  });

  return serializeBusiness(result.business);
};
