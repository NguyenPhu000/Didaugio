import prisma from "../../config/prismaClient.js";

/**
 * Lấy danh sách login history (sắp xếp DESC - mới nhất lên đầu)
 */
export const getAll = async (query) => {
  const { page, limit, userId, deviceName, isActive } = query;
  const skip = (page - 1) * limit;

  const where = {};
  if (userId) where.userId = userId;
  if (deviceName)
    where.deviceName = { contains: deviceName, mode: "insensitive" };
  if (isActive !== undefined) where.isActive = isActive;

  const [sessions, total] = await Promise.all([
    prisma.userSession.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastUsedAt: "desc", // Mới nhất lên đầu
      },
      skip,
      take: limit,
    }),
    prisma.userSession.count({ where }),
  ]);

  // Transform data to compute status
  const data = sessions.map((s) => {
    const now = new Date();
    let status = "active";
    if (!s.isActive) {
      status = "revoked";
    } else if (s.expiresAt < now) {
      status = "expired";
    }
    return { ...s, status };
  });

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Lấy chi tiết một session
 */
export const getById = async (id) => {
  const session = await prisma.userSession.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    const error = new Error("Không tìm thấy session");
    error.statusCode = 404;
    throw error;
  }

  // Compute status
  const now = new Date();
  let status = "active";
  if (!session.isActive) {
    status = "revoked";
  } else if (session.expiresAt < now) {
    status = "expired";
  }

  return { ...session, status };
};

/**
 * Revoke (vô hiệu hóa) một session
 */
export const revoke = async (sessionId) => {
  const session = await prisma.userSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    const error = new Error("Không tìm thấy session");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.userSession.update({
    where: { id: sessionId },
    data: { isActive: false },
  });
};

/**
 * Revoke tất cả sessions của một user (trừ current session)
 * @param {number} userId - User ID
 * @param {number|null} currentSessionId - Session ID hiện tại cần giữ lại (không phải refreshToken)
 */
export const revokeAllExcept = async (userId, currentSessionId = null) => {
  const where = {
    userId,
    isActive: true,
  };

  // Nếu có currentSessionId, exclude session đó
  if (currentSessionId) {
    where.id = { not: currentSessionId };
  }

  return await prisma.userSession.updateMany({
    where,
    data: { isActive: false },
  });
};
