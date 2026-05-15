import prisma from "../../config/prismaClient.js";

const USER_INCLUDE = {
  user: {
    select: {
      id: true,
      email: true,
      roleId: true,
      role: {
        select: {
          id: true,
          name: true,
          displayName: true,
        },
      },
      profile: {
        select: {
          fullName: true,
          avatar: true,
        },
      },
    },
  },
};

/**
 * Lấy danh sách audit logs (sắp xếp DESC - mới nhất lên đầu)
 */
export const getAll = async (query) => {
  const { page, limit, userId, action, tableName, recordId, startDate, endDate } = query;
  const skip = (page - 1) * limit;

  const where = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (tableName) where.tableName = tableName;
  if (recordId) where.recordId = recordId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: USER_INCLUDE,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Lấy chi tiết một audit log
 */
export const getById = async (id) => {
  const log = await prisma.auditLog.findUnique({
    where: { id },
    include: USER_INCLUDE,
  });

  if (!log) {
    const error = new Error("Không tìm thấy audit log");
    error.statusCode = 404;
    throw error;
  }

  return log;
};

/**
 * Tạo audit log mới (được gọi từ middleware hoặc service khác)
 */
export const create = async (data) => {
  return await prisma.auditLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      tableName: data.tableName,
      recordId: data.recordId,
      description: data.description || null,
      oldData: data.oldData || null,
      newData: data.newData || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    },
  });
};
