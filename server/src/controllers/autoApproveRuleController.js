import * as autoApproveRuleService from "../services/autoApproveRuleService.js";
import { resolveBusinessId } from "../utils/businessScope.js";
import { ERROR_CODES } from "../config/messages.js";

async function requireBusiness(req, res) {
  const businessId = await resolveBusinessId(req);
  if (!businessId) {
    res.status(400).json({
      success: false,
      data: null,
      message: "Thiếu businessId (admin) hoặc chưa có hồ sơ doanh nghiệp",
      errorCode: ERROR_CODES.MISSING_PARAMS,
    });
    return null;
  }
  return businessId;
}

export const list = async (req, res, next) => {
  try {
    const businessId = await requireBusiness(req, res);
    if (!businessId) return;
    const data = await autoApproveRuleService.listForBusiness(businessId);
    res.json({
      success: true,
      data,
      message: "Lấy danh sách rule thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const businessId = await requireBusiness(req, res);
    if (!businessId) return;
    const data = await autoApproveRuleService.createForBusiness(
      businessId,
      req.body,
    );
    res.status(201).json({
      success: true,
      data,
      message: "Tạo rule auto-duyệt thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const businessId = await requireBusiness(req, res);
    if (!businessId) return;
    const data = await autoApproveRuleService.updateForBusiness(
      parseInt(req.params.id, 10),
      businessId,
      req.body,
    );
    res.json({
      success: true,
      data,
      message: "Cập nhật rule thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const softDelete = async (req, res, next) => {
  try {
    const businessId = await requireBusiness(req, res);
    if (!businessId) return;
    const data = await autoApproveRuleService.softDeleteForBusiness(
      parseInt(req.params.id, 10),
      businessId,
    );
    res.json({
      success: true,
      data,
      message: "Đã vô hiệu hóa rule (soft delete)",
    });
  } catch (error) {
    next(error);
  }
};
