import * as invitationService from "../../services/business/staffInvitation.service.js";

/**
 * POST /api/business/staff/invite
 * Tạo invitation link (Owner/Manager)
 */
export const create = async (req, res, next) => {
  try {
    const businessId = req.business?.id || req.activeBusiness?.id;
    if (!businessId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Không tìm thấy doanh nghiệp",
        errorCode: "NO_BUSINESS",
      });
    }

    const invitation = await invitationService.createInvitation(
      businessId,
      req.user.id,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: invitation,
      message: "Tạo link mời thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/business/staff/invite/:token
 * Kiểm tra token khi staff click vào link (Public)
 */
export const validateToken = async (req, res, next) => {
  try {
    const result = await invitationService.validateInvitationToken(
      req.params.token,
    );

    res.json({
      success: true,
      data: result,
      message: "OK",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/business/staff/invite/accept
 * Hoàn tất đăng ký staff (Public)
 */
export const accept = async (req, res, next) => {
  try {
    const { token, fullName, phone, password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Token là bắt buộc",
        errorCode: "MISSING_FIELDS",
      });
    }

    const result = await invitationService.acceptInvitation(token, {
      fullName,
      phone,
      password,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: "Đăng ký thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/business/staff/invitations
 * Lấy danh sách invitations (Owner/Manager)
 */
export const getAll = async (req, res, next) => {
  try {
    const businessId = req.business?.id || req.activeBusiness?.id;
    if (!businessId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Không tìm thấy doanh nghiệp",
        errorCode: "NO_BUSINESS",
      });
    }

    const result = await invitationService.getInvitationList(
      businessId,
      req.query,
    );

    res.json({
      success: true,
      data: result,
      message: "OK",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/business/staff/invite/:id/revoke
 * Thu hồi invitation (Owner/Manager)
 */
export const revoke = async (req, res, next) => {
  try {
    const businessId = req.business?.id || req.activeBusiness?.id;
    if (!businessId) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Không tìm thấy doanh nghiệp",
        errorCode: "NO_BUSINESS",
      });
    }

    await invitationService.revokeInvitation(
      businessId,
      parseInt(req.params.id),
    );

    res.json({
      success: true,
      data: null,
      message: "Thu hồi lời mời thành công",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  validateToken,
  accept,
  getAll,
  revoke,
};
