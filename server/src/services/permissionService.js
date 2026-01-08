import prisma from "../config/prismaClient.js";
import {
  validatePermissionQuery,
  validatePermissionByModuleQuery,
} from "../models/schemas/index.js";

// =============================================================================
// PERMISSION SERVICE - BUSINESS LOGIC
// =============================================================================

/**
 * Lấy danh sách tất cả permissions
 * @param {object} query - Query params { page, limit, module, search, includeRoles }
 * @returns {Promise<object>} { permissions, total, totalPages, pagination }
 */
export const getPermissions = async (query = {}) => {
  // Validate query params
  const { page, limit, module, search, includeRoles } =
    validatePermissionQuery(query);

  // Xây dựng where clause
  const where = {};

  if (module) {
    where.module = module;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { displayName: { contains: search, mode: "insensitive" } },
    ];
  }

  // Đếm tổng số permissions
  const total = await prisma.permission.count({ where });

  // Tính pagination
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  // Lấy danh sách permissions
  const permissions = await prisma.permission.findMany({
    where,
    skip,
    take: limit,
    orderBy: [{ module: "asc" }, { id: "asc" }],
    include: {
      rolePermissions: includeRoles
        ? {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                },
              },
            },
          }
        : false,
    },
  });

  // Transform data
  const transformedPermissions = permissions.map((permission) => {
    const result = {
      id: permission.id,
      name: permission.name,
      displayName: permission.displayName,
      module: permission.module,
      description: permission.description,
      createdAt: permission.createdAt,
    };

    // Thêm thông tin roles nếu được yêu cầu
    if (includeRoles) {
      result.roles = permission.rolePermissions.map((rp) => ({
        id: rp.role.id,
        name: rp.role.name,
        displayName: rp.role.displayName,
      }));
    }

    return result;
  });

  return {
    success: true,
    data: {
      permissions: transformedPermissions,
      total,
      totalPages,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalRecords: total,
      },
    },
  };
};

/**
 * Lấy permissions grouped by module
 * @param {object} query - Query params { includeRoles }
 * @returns {Promise<object>} Permissions grouped by module với thông tin roles
 */
export const getPermissionsByModule = async (query = {}) => {
  // Validate query params
  const { includeRoles } = validatePermissionByModuleQuery(query);

  // Lấy tất cả permissions
  const permissions = await prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { id: "asc" }],
    include: {
      rolePermissions: includeRoles
        ? {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                },
              },
            },
          }
        : false,
    },
  });

  // Group by module
  const permissionsByModule = {};
  const moduleStats = {};

  permissions.forEach((permission) => {
    const module = permission.module;

    // Khởi tạo array cho module nếu chưa có
    if (!permissionsByModule[module]) {
      permissionsByModule[module] = [];
      moduleStats[module] = 0;
    }

    // Thêm permission vào module
    const permissionData = {
      id: permission.id,
      name: permission.name,
      displayName: permission.displayName,
      description: permission.description,
    };

    // Thêm roles nếu được yêu cầu
    if (includeRoles) {
      permissionData.roles = permission.rolePermissions.map((rp) => ({
        id: rp.role.id,
        name: rp.role.name,
        displayName: rp.role.displayName,
      }));
    }

    permissionsByModule[module].push(permissionData);
    moduleStats[module]++;
  });

  // Tính tổng số modules và permissions
  const totalModules = Object.keys(permissionsByModule).length;
  const totalPermissions = permissions.length;

  return {
    success: true,
    permissions: permissionsByModule,
    moduleStats,
    totalModules,
    totalPermissions,
  };
};

/**
 * Lấy danh sách modules (unique)
 * @returns {Promise<object>} Danh sách modules với số lượng permissions
 */
export const getModules = async () => {
  // Lấy tất cả modules unique
  const permissions = await prisma.permission.groupBy({
    by: ["module"],
    _count: {
      id: true,
    },
    orderBy: {
      module: "asc",
    },
  });

  // Transform data
  const modules = permissions.map((item) => ({
    name: item.module,
    permissionCount: item._count.id,
  }));

  return {
    success: true,
    data: {
      modules,
      totalModules: modules.length,
    },
  };
};
