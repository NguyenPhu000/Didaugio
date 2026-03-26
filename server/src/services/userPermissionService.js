import prisma from "../config/prismaClient.js";
import { ROLE_HIERARCHY } from "../config/constants.js";
import { ERROR_CODES } from "../config/messages.js";
import ServiceError from "../utils/serviceError.js";

/**
 * Lấy danh sách users trong một role với quyền custom
 */
export async function getUsersByRole(roleId, options = {}) {
  const { page = 1, limit = 20, search = "" } = options;
  const offset = (page - 1) * limit;

  const where = {
    roleId,
    deletedAt: null,
    ...(search && {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { profile: { fullName: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: offset,
      take: limit,
      select: {
        id: true,
        email: true,
        roleId: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            fullName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            userPermissions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      roleId: u.roleId,
      status: u.status,
      createdAt: u.createdAt,
      fullName: u.profile?.fullName || null,
      avatar: u.profile?.avatar || null,
      customPermissionCount: u._count.userPermissions,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Lấy quyền của user (role permissions + custom permissions)
 */
export async function getUserPermissions(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
      userPermissions: {
        include: {
          permission: true,
          grantedBy: {
            select: {
              id: true,
              email: true,
              profile: {
                select: { fullName: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new ServiceError("User không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

  // Quyền từ role
  const rolePermissions = user.role.rolePermissions.map((rp) => ({
    id: rp.permission.id,
    name: rp.permission.name,
    displayName: rp.permission.displayName,
    module: rp.permission.module,
    description: rp.permission.description,
    source: "role",
  }));

  // Quyền custom của user
  const customPermissions = user.userPermissions.map((up) => ({
    id: up.permission.id,
    name: up.permission.name,
    displayName: up.permission.displayName,
    module: up.permission.module,
    description: up.permission.description,
    source: "custom",
    grantedBy: up.grantedBy,
    grantedAt: up.createdAt,
  }));

  // Merge permissions (custom override role)
  const permissionMap = new Map();

  rolePermissions.forEach((p) => {
    permissionMap.set(p.id, p);
  });

  customPermissions.forEach((p) => {
    permissionMap.set(p.id, p);
  });

  const allPermissions = Array.from(permissionMap.values());

  // Group by module
  const byModule = {};
  allPermissions.forEach((p) => {
    if (!byModule[p.module]) {
      byModule[p.module] = [];
    }
    byModule[p.module].push(p);
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      roleDisplayName: user.role.displayName,
    },
    permissions: byModule,
    totalPermissions: allPermissions.length,
    customPermissionCount: customPermissions.length,
  };
}

/**
 * Cập nhật quyền custom cho user
 * @param {number} userId - User cần cập nhật
 * @param {number[]} permissionIds - Danh sách permission IDs
 * @param {number} grantedById - User thực hiện cập nhật
 */
export async function updateUserCustomPermissions(
  userId,
  permissionIds,
  grantedById,
) {
  // Kiểm tra hierarchy
  const [targetUser, granterUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { roleId: true } }),
    prisma.user.findUnique({
      where: { id: grantedById },
      select: { roleId: true },
    }),
  ]);

  if (!targetUser || !granterUser) {
    throw new ServiceError("User không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

  // Check hierarchy
  const granterLevel = ROLE_HIERARCHY[granterUser.roleId] || 0;
  const targetLevel = ROLE_HIERARCHY[targetUser.roleId] || 0;

  if (granterLevel <= targetLevel) {
    throw new ServiceError(
      "Bạn không có quyền chỉnh sửa quyền của user này",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  // Xóa tất cả quyền custom cũ
  await prisma.userPermission.deleteMany({
    where: { userId },
  });

  // Thêm quyền custom mới
  if (permissionIds.length > 0) {
    await prisma.userPermission.createMany({
      data: permissionIds.map((permissionId) => ({
        userId,
        permissionId,
        grantedById,
      })),
      skipDuplicates: true,
    });
  }

  return getUserPermissions(userId);
}

/**
 * Cập nhật quyền cho nhiều users cùng lúc
 */
export async function bulkUpdateUserPermissions(
  userIds,
  permissionIds,
  grantedById,
) {
  const granterUser = await prisma.user.findUnique({
    where: { id: grantedById },
    select: { roleId: true },
  });

  if (!granterUser) {
    throw new ServiceError("User không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

  const granterLevel = ROLE_HIERARCHY[granterUser.roleId] || 0;

  // Kiểm tra tất cả target users
  const targetUsers = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, roleId: true },
  });

  for (const user of targetUsers) {
    const targetLevel = ROLE_HIERARCHY[user.roleId] || 0;
    if (granterLevel <= targetLevel) {
      throw new ServiceError(
        `Bạn không có quyền chỉnh sửa quyền của user ID ${user.id}`,
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }
  }

  // Xóa quyền custom cũ
  await prisma.userPermission.deleteMany({
    where: { userId: { in: userIds } },
  });

  // Thêm quyền mới cho tất cả users
  if (permissionIds.length > 0) {
    const data = [];
    userIds.forEach((userId) => {
      permissionIds.forEach((permissionId) => {
        data.push({ userId, permissionId, grantedById });
      });
    });

    await prisma.userPermission.createMany({
      data,
      skipDuplicates: true,
    });
  }

  return {
    updated: userIds.length,
    userIds,
  };
}

/**
 * Xóa tất cả quyền custom của user
 */
export async function removeUserCustomPermissions(userId, grantedById) {
  const [targetUser, granterUser] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { roleId: true } }),
    prisma.user.findUnique({
      where: { id: grantedById },
      select: { roleId: true },
    }),
  ]);

  if (!targetUser || !granterUser) {
    throw new ServiceError("User không tồn tại", 404, ERROR_CODES.NOT_FOUND);
  }

  const granterLevel = ROLE_HIERARCHY[granterUser.roleId] || 0;
  const targetLevel = ROLE_HIERARCHY[targetUser.roleId] || 0;

  if (granterLevel <= targetLevel) {
    throw new ServiceError(
      "Bạn không có quyền xóa quyền của user này",
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  await prisma.userPermission.deleteMany({
    where: { userId },
  });

  return { success: true, message: "Đã xóa tất cả quyền custom" };
}
