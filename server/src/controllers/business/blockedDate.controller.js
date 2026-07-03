import * as blockedDateService from "../../services/business/blockedDate.service.js";
import { resolveBusinessId } from "../../utils/businessScope.js";
import { ERROR_CODES } from "../../config/messages.js";

async function requireBusiness(req, res) {
  if (req.activeBusiness?.id) return req.activeBusiness.id;

  const businessId = await resolveBusinessId(req);
  if (!businessId) {
    res.status(400).json({
      success: false,
      data: null,
      message: "Thiếu businessId hoặc chưa có hồ sơ doanh nghiệp",
      errorCode: ERROR_CODES.MISSING_PARAMS,
    });
    return null;
  }
  return businessId;
}

export const getAll = async (req, res, next) => {
  try {
    const businessId = await requireBusiness(req, res);
    if (!businessId) return;
    const data = await blockedDateService.listForBusiness(businessId, req.query);
    res.json({
      success: true,
      data,
      message: "Lấy danh sách ngày chặn thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const businessId = await requireBusiness(req, res);
    if (!businessId) return;
    const data = await blockedDateService.createForBusiness(
      businessId,
      req.user.userId,
      req.body,
    );
    res.status(201).json({
      success: true,
      data,
      message: "Chặn ngày thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const businessId = await requireBusiness(req, res);
    if (!businessId) return;
    await blockedDateService.removeForBusiness(
      parseInt(req.params.id, 10),
      businessId,
    );
    res.json({
      success: true,
      data: null,
      message: "Bỏ chặn ngày thành công",
    });
  } catch (error) {
    next(error);
  }
};
