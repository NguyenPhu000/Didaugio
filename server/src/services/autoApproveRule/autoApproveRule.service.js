import prisma from "../../config/prismaClient.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";
import { validateAutoApproveConditions } from "../../models/index.js";

export async function listForBusiness(businessId) {
  return prisma.autoApproveRule.findMany({
    where: { businessId, isDeleted: false },
    orderBy: [{ priority: "desc" }, { id: "asc" }],
  });
}

export async function createForBusiness(businessId, payload) {
  validateAutoApproveConditions(payload.conditions);
  return prisma.autoApproveRule.create({
    data: {
      businessId,
      priority: payload.priority ?? 0,
      conditions: payload.conditions,
      isActive: payload.isActive ?? true,
    },
  });
}

export async function updateForBusiness(ruleId, businessId, payload) {
  const existing = await prisma.autoApproveRule.findFirst({
    where: { id: ruleId, businessId, isDeleted: false },
  });
  if (!existing) {
    throw new ServiceError("Rule không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }
  if (payload.conditions) {
    validateAutoApproveConditions(payload.conditions);
  }
  return prisma.autoApproveRule.update({
    where: { id: ruleId },
    data: {
      ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
      ...(payload.conditions ? { conditions: payload.conditions } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
    },
  });
}

export async function softDeleteForBusiness(ruleId, businessId) {
  const existing = await prisma.autoApproveRule.findFirst({
    where: { id: ruleId, businessId, isDeleted: false },
  });
  if (!existing) {
    throw new ServiceError("Rule không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }
  return prisma.autoApproveRule.update({
    where: { id: ruleId },
    data: { isDeleted: true, isActive: false },
  });
}
