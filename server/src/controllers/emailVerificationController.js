import * as emailVerificationService from "../services/emailVerificationService.js";
import prisma from "../config/prismaClient.js";
import { ERROR_CODES } from "../config/messages.js";
import {
  emailVerificationQuerySchema,
  createEmailVerificationSchema,
  activityVerifyEmailSchema as verifyEmailSchema,
} from "../models/index.js";

/**
 * GET /api/email-verifications
 * Lấy danh sách email verifications với filters và pagination
 */
export const getAll = async (req, res, next) => {
  try {
    const validation = emailVerificationQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Dữ liệu không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
        errors: validation.error.errors,
      });
    }

    const result = await emailVerificationService.getAll(validation.data);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách xác thực email thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/email-verifications
 * Tạo token xác thực email mới (admin hoặc resend)
 */
export const create = async (req, res, next) => {
  try {
    const validation = createEmailVerificationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Dữ liệu không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
        errors: validation.error.errors,
      });
    }

    // Lấy thông tin user để gửi email
    const user = await prisma.user.findUnique({
      where: { id: validation.data.userId },
      include: {
        profile: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: "Không tìm thấy user",
        errorCode: ERROR_CODES.NOT_FOUND,
      });
    }

    const verification = await emailVerificationService.create({
      userId: validation.data.userId,
      email: validation.data.email,
      name: user.profile?.fullName,
    });

    res.status(201).json({
      success: true,
      message: "Đã tạo token xác thực email và gửi email",
      data: verification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/email-verifications/verify
 * Xác thực email bằng token
 */
export const verify = async (req, res, next) => {
  try {
    const validation = verifyEmailSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Dữ liệu không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
        errors: validation.error.errors,
      });
    }

    const verification = await emailVerificationService.verify(
      validation.data.token,
    );

    res.json({
      success: true,
      message: "Xác thực email thành công",
      data: verification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/email-verifications/resend/:userId
 * Gửi lại email xác thực
 */
export const resend = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "User ID không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const verification = await emailVerificationService.resend(userId);

    res.json({
      success: true,
      message: "Đã gửi lại email xác thực",
      data: verification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/email-verifications/manual-verify/:userId
 * Admin xác thực email thủ công (không cần token)
 */
export const manualVerify = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "User ID không hợp lệ",
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
    }

    const result = await emailVerificationService.manualVerify(userId);

    res.json({
      success: true,
      message: "Đã xác thực email thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
