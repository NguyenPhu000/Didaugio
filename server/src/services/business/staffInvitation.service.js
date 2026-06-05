import crypto from "crypto";
import bcrypt from "bcrypt";
import prisma from "../../config/prismaClient.js";
import { ROLES, USER_STATUS } from "../../config/constants.js";
import ServiceError from "../../utils/serviceError.js";
import { generateUniqueUsername } from "../../utils/username.js";
import { sendStaffInvitationEmail } from "../communication/mailer.service.js";

const INVITATION_EXPIRY_DAYS = 7;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

/**
 * Hash token trước khi lưu/lookup (SHA-256, giống password reset)
 */
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Tạo invitation link cho staff
 */
export const createInvitation = async (businessId, createdById, data) => {
  const { email, roleId } = data;

  // Validate roleId nếu được cung cấp
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
  }

  // Kiểm tra email đã là staff của business chưa
  if (email) {
    const existingStaff = await prisma.user.findFirst({
      where: {
        email,
        businessId,
        roleId: ROLES.STAFF,
        deletedAt: null,
      },
    });
    if (existingStaff) {
      throw new ServiceError(
        "Email này đã là nhân viên của doanh nghiệp",
        400,
        "ALREADY_STAFF",
      );
    }

    // Kiểm tra invitation pending cho email này
    const pendingInvite = await prisma.staffInvitation.findFirst({
      where: {
        email,
        businessId,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
    });
    if (pendingInvite) {
      throw new ServiceError(
        "Đã có lời mời chờ xử lý cho email này",
        400,
        "INVITATION_EXISTS",
      );
    }
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

  const invitation = await prisma.staffInvitation.create({
    data: {
      businessId,
      roleId: roleId || null,
      email: email || null,
      token: tokenHash,
      status: "pending",
      expiresAt,
      createdBy: createdById,
    },
    include: {
      role: { select: { id: true, name: true } },
      business: { select: { businessName: true } },
    },
  });

  // Gửi email mời nếu có email (dùng rawToken, không phải hash)
  let emailSent = false;
  if (email) {
    try {
      await sendStaffInvitationEmail({
        to: email,
        token: rawToken,
        businessName: invitation.business.businessName,
        roleName: invitation.role?.name || null,
        expiresAt: invitation.expiresAt,
      });
      emailSent = true;
    } catch (err) {
      // Không fail toàn bộ nếu gửi email lỗi
      console.error("Failed to send staff invitation email:", err.message);
    }
  }

  return {
    id: invitation.id,
    token: rawToken,
    email: invitation.email,
    roleName: invitation.role?.name || null,
    businessName: invitation.business.businessName,
    expiresAt: invitation.expiresAt,
    emailSent,
  };
};

/**
 * Kiểm tra token khi staff click vào link
 */
export const validateInvitationToken = async (token) => {
  const tokenHash = hashToken(token);
  const invitation = await prisma.staffInvitation.findUnique({
    where: { token: tokenHash },
    include: {
      role: { select: { id: true, name: true, description: true } },
      business: { select: { id: true, businessName: true } },
    },
  });

  if (!invitation) {
    throw new ServiceError("Link mời không hợp lệ", 404, "INVITATION_NOT_FOUND");
  }

  if (invitation.status !== "pending") {
    const statusMsg = {
      accepted: "Lời mời đã được sử dụng",
      expired: "Lời mời đã hết hạn",
      revoked: "Lời mời đã bị thu hồi",
    };
    throw new ServiceError(
      statusMsg[invitation.status] || "Lời mời không còn hiệu lực",
      400,
      "INVITATION_INVALID",
    );
  }

  if (new Date() > invitation.expiresAt) {
    // Cập nhật status thành expired
    await prisma.staffInvitation.update({
      where: { id: invitation.id },
      data: { status: "expired" },
    });
    throw new ServiceError("Lời mời đã hết hạn", 400, "INVITATION_EXPIRED");
  }

  return {
    id: invitation.id,
    email: invitation.email,
    roleName: invitation.role?.name || null,
    roleDescription: invitation.role?.description || null,
    businessName: invitation.business.businessName,
    expiresAt: invitation.expiresAt,
  };
};

/**
 * Hoàn tất đăng ký staff từ invitation
 */
export const acceptInvitation = async (token, staffData) => {
  const { fullName, phone, password } = staffData;

  // Validate
  if (!fullName || !password) {
    throw new ServiceError(
      "Họ tên và mật khẩu là bắt buộc",
      400,
      "MISSING_FIELDS",
    );
  }

  if (password.length < 8) {
    throw new ServiceError(
      "Mật khẩu phải có ít nhất 8 ký tự",
      400,
      "WEAK_PASSWORD",
    );
  }

  if (!PASSWORD_REGEX.test(password)) {
    throw new ServiceError(
      "Mật khẩu phải có ít nhất: 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt",
      400,
      "WEAK_PASSWORD",
    );
  }

  // Tìm và validate invitation (hash token trước khi lookup)
  const tokenHash = hashToken(token);
  const invitation = await prisma.staffInvitation.findUnique({
    where: { token: tokenHash },
    include: {
      business: { select: { id: true } },
    },
  });

  if (!invitation) {
    throw new ServiceError("Link mời không hợp lệ", 404, "INVITATION_NOT_FOUND");
  }

  if (invitation.status !== "pending") {
    throw new ServiceError(
      "Lời mời không còn hiệu lực",
      400,
      "INVITATION_INVALID",
    );
  }

  if (new Date() > invitation.expiresAt) {
    await prisma.staffInvitation.update({
      where: { id: invitation.id },
      data: { status: "expired" },
    });
    throw new ServiceError("Lời mời đã hết hạn", 400, "INVITATION_EXPIRED");
  }

  // Kiểm tra email đã tồn tại chưa (nếu invitation có email)
  if (invitation.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
      select: { id: true },
    });
    if (existingUser) {
      throw new ServiceError(
        "Email đã được sử dụng bởi tài khoản khác",
        400,
        "EMAIL_EXISTS",
      );
    }
  }

  const hashedPassword = await bcrypt.hash(password, 13);
  const username = await generateUniqueUsername({
    prismaClient: prisma,
    email: invitation.email || `staff_${Date.now()}`,
    fallback: "staff",
  });

  // Tạo user + profile trong transaction
  const result = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: invitation.email || `${username}@didaugio.local`,
        username,
        password: hashedPassword,
        roleId: ROLES.STAFF,
        businessId: invitation.businessId,
        businessRoleId: invitation.roleId,
        status: USER_STATUS.ACTIVE,
      },
      select: { id: true, email: true, username: true },
    });

    await tx.userProfile.create({
      data: {
        userId: newUser.id,
        fullName,
        phone: phone || null,
      },
    });

    // Cập nhật invitation
    await tx.staffInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "accepted",
        acceptedAt: new Date(),
        acceptedBy: newUser.id,
      },
    });

    return newUser;
  });

  return {
    id: result.id,
    email: result.email,
    username: result.username,
    message: "Đăng ký thành công! Bạn có thể đăng nhập ngay.",
  };
};

/**
 * Lấy danh sách invitations của business
 */
export const getInvitationList = async (businessId, query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const { status } = query;
  const skip = (page - 1) * limit;

  const where = { businessId };
  if (status) where.status = status;

  const [invitations, total] = await Promise.all([
    prisma.staffInvitation.findMany({
      where,
      include: {
        role: { select: { id: true, name: true } },
        acceptedByUser: {
          select: { id: true, email: true, profile: { select: { fullName: true } } },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.staffInvitation.count({ where }),
  ]);

  return {
    invitations,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Thu hồi invitation
 */
export const revokeInvitation = async (businessId, invitationId) => {
  const invitation = await prisma.staffInvitation.findFirst({
    where: {
      id: invitationId,
      businessId,
      status: "pending",
    },
  });

  if (!invitation) {
    throw new ServiceError(
      "Lời mời không tồn tại hoặc đã được xử lý",
      404,
      "INVITATION_NOT_FOUND",
    );
  }

  await prisma.staffInvitation.update({
    where: { id: invitationId },
    data: { status: "revoked" },
  });

  return true;
};

export default {
  createInvitation,
  validateInvitationToken,
  acceptInvitation,
  getInvitationList,
  revokeInvitation,
};
