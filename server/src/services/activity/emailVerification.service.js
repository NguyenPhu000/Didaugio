import prisma from "../../config/prismaClient.js";
import crypto from "crypto";
import { sendVerificationEmail } from "../communication/mailer.service.js";

/**
 * Lấy danh sách email verifications (sắp xếp DESC - mới nhất lên đầu)
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
      where.verifiedAt = null;
      where.expiresAt = { gte: now };
    } else if (status === "verified") {
      where.verifiedAt = { not: null };
    } else if (status === "expired") {
      where.verifiedAt = null;
      where.expiresAt = { lt: now };
    }
  }

  const [verifications, total] = await Promise.all([
    prisma.emailVerification.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            emailVerified: true,
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
    prisma.emailVerification.count({ where }),
  ]);

  // Transform data to include status
  const data = verifications.map((v) => {
    const now = new Date();
    let computedStatus = "pending";
    if (v.verifiedAt) {
      computedStatus = "verified";
    } else if (v.expiresAt < now) {
      computedStatus = "expired";
    }
    return { ...v, status: computedStatus };
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
 * Tạo token xác thực email mới (lưu hash vào DB, gửi raw token qua email)
 */
export const create = async (data) => {
  // Generate secure raw token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Token expires in 24 hours
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Delete old unverified tokens for this user
  await prisma.emailVerification.deleteMany({
    where: {
      userId: data.userId,
      verifiedAt: null,
    },
  });

  const record = await prisma.emailVerification.create({
    data: {
      userId: data.userId,
      email: data.email,
      token: tokenHash, // lưu hash, không lưu raw token
      expiresAt,
    },
  });

  // In link xác thực ra log console (tiện lợi cho việc dev/test khi SMTP lỗi)
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const verifyLink = `${frontendUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
  console.log(`\n[DEV ONLY] Link xac thuc email cho user ${data.email}:\n${verifyLink}\n`);

  // Gửi email với raw token
  try {
    await sendVerificationEmail({
      to: data.email,
      token: rawToken,
      name: data.name,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
    // Không throw error để không block việc tạo token
    // Admin có thể resend sau
  }

  return record;
};

/**
 * Xác thực email bằng raw token (hash trước khi lookup)
 */
export const verify = async (rawToken) => {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const verification = await prisma.emailVerification.findUnique({
    where: { token: tokenHash },
    include: {
      user: true,
    },
  });

  if (!verification) {
    const error = new Error("Token không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  if (verification.verifiedAt) {
    const error = new Error("Email đã được xác thực trước đó");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  if (verification.expiresAt < now) {
    const error = new Error("Token đã hết hạn");
    error.statusCode = 400;
    throw error;
  }

  // Update verification and user
  const [updatedVerification] = await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { verifiedAt: now },
    }),
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: true },
    }),
  ]);

  return updatedVerification;
};

/**
 * Resend verification email
 */
export const resend = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        select: {
          fullName: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error("Không tìm thấy user");
    error.statusCode = 404;
    throw error;
  }

  if (user.emailVerified) {
    const error = new Error("Email đã được xác thực");
    error.statusCode = 400;
    throw error;
  }

  return await create({
    userId: user.id,
    email: user.email,
    name: user.profile?.fullName,
  });
};

/**
 * Manual verify - Admin xác thực email thủ công (không cần token)
 * Dùng khi user không nhận được email hoặc token đã hết hạn
 */
export const manualVerify = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error("Không tìm thấy user");
    error.statusCode = 404;
    throw error;
  }

  if (user.emailVerified) {
    const error = new Error("Email đã được xác thực trước đó");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();

  // Update user và đánh dấu verification records nếu có
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    }),
    // Đánh dấu tất cả pending verifications của user này là đã verify
    prisma.emailVerification.updateMany({
      where: {
        userId,
        verifiedAt: null,
      },
      data: { verifiedAt: now },
    }),
  ]);

  return { userId, verifiedAt: now };
};
