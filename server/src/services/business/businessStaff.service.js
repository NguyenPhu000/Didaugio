import prisma from "../../config/prismaClient.js";
import { BCRYPT_SALT_ROUNDS, ROLES, USER_STATUS } from "../../config/constants.js";
import ServiceError from "../../utils/serviceError.js";
import { generateUniqueUsername } from "../../utils/username.js";
import { assertBusinessLimit } from "../subscription/subscriptionEntitlement.service.js";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const assertStrongPassword = (password) => {
  if (!password || !PASSWORD_REGEX.test(password)) {
    throw new ServiceError(
      "Mat khau phai co it nhat 8 ky tu, gom chu hoa, chu thuong, so va ky tu dac biet",
      400,
      "WEAK_PASSWORD",
    );
  }
};

const STAFF_SELECT = {
  id: true,
  email: true,
  username: true,
  status: true,
  createdAt: true,
  profile: {
    select: {
      fullName: true,
      phone: true,
      avatar: true,
    },
  },
};

/**
 * Get all staff for a business
 */
export const getStaffList = async (businessId, query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const { status, search } = query;
  const skip = (page - 1) * limit;

  const where = {
    businessId,
    roleId: ROLES.STAFF,
    deletedAt: null,
  };

  if (status) where.status = status;

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
      { profile: { fullName: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [staff, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: STAFF_SELECT,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    staff,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Create a staff account under a business
 */
export const createStaff = async (businessId, data) => {
  const { email, password, fullName, phone, roleId } = data;

  const activeStaffCount = await prisma.user.count({
    where: { businessId, roleId: ROLES.STAFF, deletedAt: null },
  });
  await assertBusinessLimit(businessId, "maxStaff", activeStaffCount);

  if (!email || !password) {
    throw new ServiceError("Email và mật khẩu là bắt buộc", 400, "MISSING_FIELDS");
  }

  if (password.length < 6) {
    throw new ServiceError("Mật khẩu phải có ít nhất 6 ký tự", 400, "WEAK_PASSWORD");
  }

  assertStrongPassword(password);

  // Validate businessRoleId if provided
  let businessRoleId = null;
  if (roleId) {
    const role = await prisma.businessRole.findFirst({
      where: {
        id: roleId,
        OR: [
          { businessId: null, isDefault: true },
          { businessId },
        ],
      },
    });
    if (!role) {
      throw new ServiceError("Vai trò không tồn tại", 404, "ROLE_NOT_FOUND");
    }
    businessRoleId = role.id;
  }

  // Check email uniqueness
  const existingEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingEmail) {
    throw new ServiceError("Email đã được sử dụng", 400, "EXISTED");
  }

  const username = await generateUniqueUsername({
    prismaClient: prisma,
    email,
    fallback: "staff",
  });

  const bcrypt = await import("bcrypt");
  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        roleId: ROLES.STAFF,
        businessId,
        businessRoleId,
        status: USER_STATUS.ACTIVE,
        emailVerified: true,
      },
      select: { id: true, email: true, username: true },
    });

    await tx.userProfile.create({
      data: {
        userId: newUser.id,
        fullName: fullName || null,
        phone: phone || null,
      },
    });

    return newUser;
  });

  return user;
};

/**
 * Update a staff account (fullName, phone, status)
 */
export const updateStaff = async (businessId, staffId, data) => {
  assertStrongPassword(newPassword);

  const staff = await prisma.user.findFirst({
    where: {
      id: staffId,
      businessId,
      roleId: ROLES.STAFF,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!staff) {
    throw new ServiceError("Nhân viên không tồn tại", 404, "NOT_FOUND");
  }

  const { fullName, phone, status } = data;

  const user = await prisma.user.update({
    where: { id: staffId },
    data: {
      ...(status && { status }),
      ...(fullName !== undefined || phone !== undefined
        ? {
            profile: {
              upsert: {
                create: { fullName: fullName || null, phone: phone || null },
                update: {
                  ...(fullName !== undefined && { fullName }),
                  ...(phone !== undefined && { phone }),
                },
              },
            },
          }
        : {}),
    },
    select: STAFF_SELECT,
  });

  return user;
};

/**
 * Reset staff password
 */
export const resetStaffPassword = async (businessId, staffId, newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    throw new ServiceError("Mật khẩu phải có ít nhất 6 ký tự", 400, "WEAK_PASSWORD");
  }

  const staff = await prisma.user.findFirst({
    where: {
      id: staffId,
      businessId,
      roleId: ROLES.STAFF,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!staff) {
    throw new ServiceError("Nhân viên không tồn tại", 404, "NOT_FOUND");
  }

  const bcrypt = await import("bcrypt");
  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  await prisma.user.update({
    where: { id: staffId },
    data: { password: hashedPassword },
  });

  return true;
};

/**
 * Deactivate (soft lock) a staff account
 */
export const deactivateStaff = async (businessId, staffId) => {
  const staff = await prisma.user.findFirst({
    where: {
      id: staffId,
      businessId,
      roleId: ROLES.STAFF,
      deletedAt: null,
    },
    select: { id: true, status: true },
  });

  if (!staff) {
    throw new ServiceError("Nhân viên không tồn tại", 404, "NOT_FOUND");
  }

  await prisma.user.update({
    where: { id: staffId },
    data: { status: USER_STATUS.INACTIVE },
  });

  return true;
};

/**
 * Reactivate a staff account
 */
export const activateStaff = async (businessId, staffId) => {
  const staff = await prisma.user.findFirst({
    where: {
      id: staffId,
      businessId,
      roleId: ROLES.STAFF,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!staff) {
    throw new ServiceError("Nhân viên không tồn tại", 404, "NOT_FOUND");
  }

  await prisma.user.update({
    where: { id: staffId },
    data: { status: USER_STATUS.ACTIVE },
  });

  return true;
};

/**
 * Get staff detail
 */
export const getStaffDetail = async (businessId, staffId) => {
  const staff = await prisma.user.findFirst({
    where: {
      id: staffId,
      businessId,
      roleId: ROLES.STAFF,
      deletedAt: null,
    },
    select: {
      ...STAFF_SELECT,
      // Include recent booking actions for accountability
      bookingActionLogs: {
        select: {
          id: true,
          action: true,
          createdAt: true,
          booking: {
            select: { id: true, bookingCode: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!staff) {
    throw new ServiceError("Nhân viên không tồn tại", 404, "NOT_FOUND");
  }

  return staff;
};

/**
 * Get aggregated staff stats for a business
 */
export const getStaffStats = async (businessId) => {
  const baseWhere = {
    businessId,
    roleId: ROLES.STAFF,
    deletedAt: null,
  };

  const [total, active, inactive, byRole] = await Promise.all([
    prisma.user.count({ where: baseWhere }),
    prisma.user.count({ where: { ...baseWhere, status: USER_STATUS.ACTIVE } }),
    prisma.user.count({ where: { ...baseWhere, status: USER_STATUS.INACTIVE } }),
    prisma.user.groupBy({
      by: ["businessRoleId"],
      where: baseWhere,
      _count: { id: true },
    }),
  ]);

  // Enrich role breakdown with role names
  const roleIds = byRole
    .map((r) => r.businessRoleId)
    .filter((id) => id !== null);

  const roles = roleIds.length
    ? await prisma.businessRole.findMany({
        where: { id: { in: roleIds } },
        select: { id: true, name: true },
      })
    : [];

  const roleMap = Object.fromEntries(roles.map((r) => [r.id, r.name]));

  const byRoleBreakdown = byRole.map((r) => ({
    roleId: r.businessRoleId,
    roleName: r.businessRoleId ? roleMap[r.businessRoleId] || "Chưa phân quyền" : "Chưa phân quyền",
    count: r._count.id,
  }));

  return {
    total,
    active,
    inactive,
    byRole: byRoleBreakdown,
  };
};

export default {
  getStaffList,
  createStaff,
  updateStaff,
  resetStaffPassword,
  deactivateStaff,
  activateStaff,
  getStaffDetail,
  getStaffStats,
};
