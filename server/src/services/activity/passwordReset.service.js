import prisma from "../../config/prismaClient.js";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../communication/mailer.service.js";

/**
 * Lấy danh sách password resets (sắp xếp DESC - mới nhất lên đầu)
 */
export const getAll = async (query) => {
  const { page, limit, userId, status } = query;
  const skip = (page - 1) * limit;

  const where = {};
  if (userId) where.userId = userId;

  // Filter by status
  if (status) {
    const now = new Date();
    if (status === "pending") {
      where.usedAt = null;
      where.expiresAt = { gte: now };
    } else if (status === "used") {
      where.usedAt = { not: null };
    } else if (status === "expired") {
      where.usedAt = null;
      where.expiresAt = { lt: now };
    }
  }

  const [resets, total] = await Promise.all([
    prisma.passwordReset.findMany({
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
        createdAt: "desc", // Mới nhất lên đầu
      },
      skip,
      take: limit,
    }),
    prisma.passwordReset.count({ where }),
  ]);

  // Transform data to include status
  const data = resets.map((r) => {
    const now = new Date();
    let computedStatus = "pending";
    if (r.usedAt) {
      computedStatus = "used";
    } else if (r.expiresAt < now) {
      computedStatus = "expired";
    }
    return { ...r, status: computedStatus };
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
 * Tạo yêu cầu reset password (lưu hash vào DB, gửi raw token qua email)
 */
export const create = async (email, ipAddress) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      profile: {
        select: {
          fullName: true,
        },
      },
    },
  });

  if (!user) {
    // Không tiết lộ user có tồn tại hay không (security)
    return {
      success: true,
      message: "Nếu email tồn tại, link reset đã được gửi",
    };
  }

  // Generate secure raw token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Token expires in 1 hour
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // Delete old unused tokens for this user
  await prisma.passwordReset.deleteMany({
    where: {
      userId: user.id,
      usedAt: null,
    },
  });

  const reset = await prisma.passwordReset.create({
    data: {
      userId: user.id,
      email: user.email,
      token: tokenHash, // lưu hash, không lưu raw token
      expiresAt,
      ipAddress,
    },
  });

  // Gửi email với raw token
  try {
    await sendPasswordResetEmail({
      to: user.email,
      token: rawToken,
      name: user.profile?.fullName,
    });
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    // Không throw error để không tiết lộ user có tồn tại
  }

  return {
    ...reset,
  };
};

/**
 * Reset password bằng raw token (hash trước khi lookup)
 */
export const reset = async (rawToken, newPassword) => {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const reset = await prisma.passwordReset.findUnique({
    where: { token: tokenHash },
    include: {
      user: true,
    },
  });

  if (!reset) {
    const error = new Error("Token không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  if (reset.usedAt) {
    const error = new Error("Token đã được sử dụng");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  if (reset.expiresAt < now) {
    const error = new Error("Token đã hết hạn");
    error.statusCode = 400;
    throw error;
  }

  // Hash new password with increased cost factor
  const bcrypt = await import("bcrypt");
  const hashedPassword = await bcrypt.hash(newPassword, 13);

  // Update password, revoke all sessions, and mark token as used
  await prisma.$transaction([
    prisma.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: now },
    }),
    prisma.user.update({
      where: { id: reset.userId },
      data: {
        password: hashedPassword,
        failedLoginCount: 0, // Reset failed login count
      },
    }),
    prisma.userSession.deleteMany({
      where: { userId: reset.userId },
    }),
  ]);

  return { success: true, message: "Đã đặt lại mật khẩu thành công" };
};
