import prisma from "../../config/prismaClient.js";
import {
  validateRoleId,
  validateRoleQuery,
  validateUpdateRolePermissions,
  roleUsersQuerySchema,
} from "../../models/index.js";
import { ERROR_CODES } from "../../config/messages.js";
import ServiceError from "../../utils/serviceError.js";
import { invalidateRoleCache } from "../../utils/permissionCache.js";

/**
 * Lấy danh sách tất cả vai trò
 * @param {object} query - Query params { page, limit, search, includePermissions, includeUserCount }
 * @returns {Promise<object>} { roles, total, totalPages, pagination }
 */
export const getRoles = async (query = {}) => {
  // Validate query params
  const { page, limit, search, includePermissions, includeUserCount } =
    validateRoleQuery(query);

  // Xây dựng where clause
  const where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { displayName: { contains: search, mode: "insensitive" } },
    ];
  }

  // Đếm tổng số roles
  const total = await prisma.role.count({ where });

  // Tính pagination
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  // Lấy danh sách roles
  const roles = await prisma.role.findMany({
    where,
    skip,
    take: limit,
    orderBy: { id: "asc" },
    include: {
      rolePermissions: includePermissions
        ? {
            include: {
              permission: true,
            },
          }
        : true,
      users: includeUserCount
        ? {
            where: { deletedAt: null },
            select: { id: true },
          }
        : false,
    },
  });

  // Transform data
  const transformedRoles = roles.map((role) => {
    const result = {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      permissionCount: role.rolePermissions?.length || 0,
    };

    // Thêm chi tiết quyền nếu được yêu cầu
    if (includePermissions) {
      result.permissions = role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        displayName: rp.permission.displayName,
        module: rp.permission.module,
        description: rp.permission.description,
      }));
    }

    // Thêm số lượng người dùng
    if (includeUserCount) {
      result.userCount = role.users?.length || 0;
    }

    return result;
  });

  return {
    success: true,
    data: transformedRoles,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Lấy thông tin chi tiết 1 vai trò
 * @param {number} roleId - ID vai trò
 * @returns {Promise<object>} Thông tin vai trò + quyền + số người dùng
 */
export const getRoleById = async (roleId) => {
  // Validate ID
  const validatedId = validateRoleId(roleId);

  // Lấy role với permissions và user count
  const role = await prisma.role.findUnique({
    where: { id: validatedId },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: {
          users: {
            where: { deletedAt: null },
          },
        },
      },
    },
  });

  if (!role) {
    throw new ServiceError(
      "Không tìm thấy vai trò",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  // Transform data
  return {
    success: true,
    data: {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        displayName: rp.permission.displayName,
        module: rp.permission.module,
        description: rp.permission.description,
      })),
      permissionCount: role.rolePermissions.length,
      userCount: role._count.users,
    },
  };
};

/**
 * Lấy danh sách quyền của 1 vai trò
 * @param {number} roleId - ID vai trò
 * @returns {Promise<object>} Danh sách permissions grouped by module
 */
export const getRolePermissions = async (roleId) => {
  // Validate ID
  const validatedId = validateRoleId(roleId);

  // Kiểm tra role tồn tại
  const role = await prisma.role.findUnique({
    where: { id: validatedId },
    select: {
      id: true,
      name: true,
      displayName: true,
    },
  });

  if (!role) {
    throw new ServiceError(
      "Không tìm thấy vai trò",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  // Lấy tất cả permissions của role
  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId: validatedId },
    include: {
      permission: true,
    },
  });

  // Group by module
  const permissionsByModule = {};
  rolePermissions.forEach((rp) => {
    const module = rp.permission.module;
    if (!permissionsByModule[module]) {
      permissionsByModule[module] = [];
    }
    permissionsByModule[module].push({
      id: rp.permission.id,
      name: rp.permission.name,
      displayName: rp.permission.displayName,
      description: rp.permission.description,
    });
  });

  return {
    success: true,
    data: {
      role,
      permissions: permissionsByModule,
      totalPermissions: rolePermissions.length,
    },
  };
};

/**
 * Cập nhật quyền cho vai trò
 * @param {number} roleId - ID vai trò
 * @param {object} permissionData - { permissionIds: [1, 2, 3] }
 * @returns {Promise<object>} Thông tin vai trò sau khi cập nhật
 */
export const updateRolePermissions = async (roleId, permissionData, currentUser = null) => {
  // Validate inputs
  const validatedId = validateRoleId(roleId);
  const { permissionIds } = validateUpdateRolePermissions(permissionData);

  // Kiểm tra role tồn tại
  const role = await prisma.role.findUnique({
    where: { id: validatedId },
    select: {
      id: true,
      name: true,
      displayName: true,
      isSystem: true,
    },
  });

  if (!role) {
    throw new ServiceError(
      "Không tìm thấy vai trò",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  // Super Admin role (id=1) is always protected — uses wildcard, no need to edit
  if (role.id === 1) {
    throw new ServiceError(
      "Không thể thay đổi quyền của Super Admin (tự động có toàn quyền)",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  // Block non-Super-Admin from modifying system roles
  if (role.isSystem && currentUser?.roleId !== 1) {
    throw new ServiceError(
      "Không thể thay đổi quyền của vai trò hệ thống",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  // Kiểm tra tất cả permission IDs có tồn tại không
  if (permissionIds.length > 0) {
    const existingPermissions = await prisma.permission.findMany({
      where: {
        id: { in: permissionIds },
      },
      select: { id: true },
    });

    if (existingPermissions.length !== permissionIds.length) {
      throw new ServiceError(
        "Một số quyền không tồn tại trong hệ thống",
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
  }

  // Thực hiện transaction: xóa quyền cũ và thêm quyền mới
  const result = await prisma.$transaction(async (tx) => {
    // 1. Xóa tất cả quyền cũ
    await tx.rolePermission.deleteMany({
      where: { roleId: validatedId },
    });

    // 2. Thêm quyền mới (nếu có)
    if (permissionIds.length > 0) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: validatedId,
          permissionId,
        })),
      });
    }

    // 3. Lấy thông tin role sau khi update
    const updatedRole = await tx.role.findUnique({
      where: { id: validatedId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return updatedRole;
  });

  // Invalidate permission cache for all users with this role
  invalidateRoleCache(validatedId);

  // Transform data
  return {
    success: true,
    data: {
      id: result.id,
      name: result.name,
      displayName: result.displayName,
      description: result.description,
      isSystem: result.isSystem,
      permissions: result.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        displayName: rp.permission.displayName,
        module: rp.permission.module,
      })),
      permissionCount: result.rolePermissions.length,
    },
    message: "Cập nhật quyền thành công",
  };
};

/**
 * Lấy danh sách người dùng theo vai trò
 * @param {number} roleId - ID vai trò
 * @param {object} query - Query params { page, limit, status, search }
 * @returns {Promise<object>} Danh sách users
 */
export const getRoleUsers = async (roleId, query = {}) => {
  // Validate inputs
  const validatedId = validateRoleId(roleId);
  const { page, limit, status, search } = roleUsersQuerySchema.parse(query);

  // Kiểm tra role tồn tại
  const role = await prisma.role.findUnique({
    where: { id: validatedId },
    select: {
      id: true,
      name: true,
      displayName: true,
    },
  });

  if (!role) {
    throw new ServiceError(
      "Không tìm thấy vai trò",
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  // Xây dựng where clause
  const where = {
    roleId: validatedId,
    deletedAt: null,
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { profile: { fullName: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Đếm tổng số users
  const total = await prisma.user.count({ where });

  // Tính pagination
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  // Lấy danh sách users
  const users = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      status: true,
      emailVerified: true,
      lastLoginAt: true,
      createdAt: true,
      profile: {
        select: {
          fullName: true,
          phone: true,
          avatar: true,
        },
      },
    },
  });

  // Transform data
  const transformedUsers = users.map((user) => ({
    id: user.id,
    email: user.email,
    fullName: user.profile?.fullName || null,
    phone: user.profile?.phone || null,
    avatar: user.profile?.avatar || null,
    status: user.status,
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  }));

  return {
    success: true,
    data: {
      role,
      users: transformedUsers,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};
