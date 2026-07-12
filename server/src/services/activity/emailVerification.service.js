import prisma from "../../config/prismaClient.js";
import crypto from "crypto";
import { sendVerificationEmail } from "../communication/mailer.service.js";

const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

const hashValue = (value) => crypto.createHash("sha256").update(String(value)).digest("hex");

const generateOtpCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

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
  const tokenHash = hashValue(rawToken);
  const otpCode = generateOtpCode();
  const otpHash = hashValue(otpCode);

  // Token expires in 24 hours
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  const otpExpiresAt = new Date();
  otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + OTP_TTL_MINUTES);

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
      otpHash,
      otpExpiresAt,
      otpAttempts: 0,
      otpLockedUntil: null,
      expiresAt,
    },
  });

  // In link xác thực ra log console (tiện lợi cho việc dev/test khi SMTP lỗi)
  // Gửi email với raw token
  try {
    await sendVerificationEmail({
      to: data.email,
      token: rawToken,
      otpCode,
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
  const tokenHash = hashValue(rawToken);

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
 * Verify email by 6-digit OTP while keeping the existing email link flow.
 */
export const verifyOtp = async ({ email, otp }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedOtp = String(otp || "").replace(/\D/g, "");
  const now = new Date();

  const verification = await prisma.emailVerification.findFirst({
    where: {
      email: normalizedEmail,
      verifiedAt: null,
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!verification || !verification.otpHash) {
    const error = new Error("Ma OTP khong hop le hoac da het han");
    error.statusCode = 400;
    throw error;
  }

  if (verification.otpLockedUntil && verification.otpLockedUntil > now) {
    const error = new Error("Ban da nhap sai qua nhieu lan. Vui long gui lai ma OTP.");
    error.statusCode = 429;
    throw error;
  }

  if (verification.expiresAt < now || !verification.otpExpiresAt || verification.otpExpiresAt < now) {
    const error = new Error("Ma OTP khong hop le hoac da het han");
    error.statusCode = 400;
    throw error;
  }

  if (hashValue(normalizedOtp) !== verification.otpHash) {
    const nextAttempts = verification.otpAttempts + 1;
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: {
        otpAttempts: nextAttempts,
        ...(nextAttempts >= MAX_OTP_ATTEMPTS
          ? { otpLockedUntil: new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000) }
          : {}),
      },
    });

    const error = new Error("Ma OTP khong dung");
    error.statusCode = 400;
    throw error;
  }

  const [updatedVerification] = await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: {
        verifiedAt: now,
        otpAttempts: 0,
        otpLockedUntil: null,
      },
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
