import prisma from "../../config/prismaClient.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";

export async function listForBusiness(businessId, filters = {}) {
  const where = { businessId };
  if (filters.fromDate || filters.toDate) {
    where.date = {};
    if (filters.fromDate) where.date.gte = filters.fromDate;
    if (filters.toDate) where.date.lte = filters.toDate;
  }
  if (filters.serviceId !== undefined) {
    where.serviceId = filters.serviceId;
  }

  return prisma.businessBlockedDate.findMany({
    where,
    include: {
      service: { select: { id: true, name: true } },
    },
    orderBy: { date: "asc" },
  });
}

export async function createForBusiness(businessId, userId, payload) {
  const existing = await prisma.businessBlockedDate.findFirst({
    where: {
      businessId,
      serviceId: payload.serviceId ?? null,
      date: payload.date,
    },
  });
  if (existing) {
    throw new ServiceError(
      "Ngày này đã bị chặn",
      409,
      ERROR_CODES.EXISTED,
    );
  }

  return prisma.businessBlockedDate.create({
    data: {
      businessId,
      serviceId: payload.serviceId ?? null,
      date: payload.date,
      reason: payload.reason ?? null,
      createdBy: userId,
    },
    include: {
      service: { select: { id: true, name: true } },
    },
  });
}

export async function removeForBusiness(id, businessId) {
  const existing = await prisma.businessBlockedDate.findFirst({
    where: { id, businessId },
  });
  if (!existing) {
    throw new ServiceError(
      "Không tìm thấy ngày chặn",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  return prisma.businessBlockedDate.delete({ where: { id } });
}
