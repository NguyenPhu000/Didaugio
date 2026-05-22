import * as businessSettingsService from "../../services/business/businessSettings.service.js";
import { resolveBusinessId } from "../../utils/businessScope.js";
import { ERROR_CODES } from "../../config/messages.js";

async function requireBusiness(req, res) {
  // Prefer the business already resolved by requireActiveBusiness middleware
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

export const getSettings = async (req, res, next) => {
  try {
    const businessId = await requireBusiness(req, res);
    if (!businessId) return;
    const data = await businessSettingsService.getSettings(businessId);
    res.json({
      success: true,
      data,
      message: "Lấy cài đặt doanh nghiệp thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const businessId = await requireBusiness(req, res);
    if (!businessId) return;
    const data = await businessSettingsService.updateSettings(
      businessId,
      req.body,
    );
    res.json({
      success: true,
      data,
      message: "Cập nhật cài đặt doanh nghiệp thành công",
    });
  } catch (error) {
    next(error);
  }
};
