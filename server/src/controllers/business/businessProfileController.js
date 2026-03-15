/**
 * Business Profile Controller - SRP: Xử lý request hồ sơ doanh nghiệp
 */
import * as businessProfileService from "../../services/business/businessProfileService.js";

export const getProfile = async (req, res, next) => {
  try {
    const business = await businessProfileService.getProfile(req.user.userId);
    res.json({
      success: true,
      data: business,
      message: "Lấy hồ sơ doanh nghiệp thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req, res, next) => {
  try {
    const data = { ...req.body };

    if (req.files?.idCardFront?.[0]) {
      data.idCardFront = req.files.idCardFront[0].path;
    }
    if (req.files?.idCardBack?.[0]) {
      data.idCardBack = req.files.idCardBack[0].path;
    }
    if (req.files?.businessLicense?.[0]) {
      data.businessLicense = req.files.businessLicense[0].path;
    }

    const business = await businessProfileService.register(
      data,
      req.user.userId,
    );
    res.status(201).json({
      success: true,
      message: "Đăng ký doanh nghiệp thành công, đang chờ duyệt",
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const previousBusiness = await businessProfileService.getProfile(
      req.user.userId,
    );
    const data = { ...req.body };

    if (req.files?.idCardFront?.[0]) {
      data.idCardFront = req.files.idCardFront[0].path;
    }
    if (req.files?.idCardBack?.[0]) {
      data.idCardBack = req.files.idCardBack[0].path;
    }
    if (req.files?.businessLicense?.[0]) {
      data.businessLicense = req.files.businessLicense[0].path;
    }

    const business = await businessProfileService.updateProfile(
      data,
      req.user.userId,
    );

    const isResubmitted =
      previousBusiness?.status !== "pending" && business?.status === "pending";

    res.json({
      success: true,
      message: isResubmitted
        ? "Cập nhật hồ sơ thành công và đã gửi duyệt lại"
        : "Cập nhật hồ sơ thành công",
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyPlaces = async (req, res, next) => {
  try {
    const places = await businessProfileService.getMyPlaces(req.user.userId);
    res.json({ success: true, data: places });
  } catch (error) {
    next(error);
  }
};

export const signContract = async (req, res, next) => {
  try {
    const business = await businessProfileService.signContract(req.user.userId);
    res.json({
      success: true,
      data: business,
      message: "Ký hợp đồng doanh nghiệp thành công",
    });
  } catch (error) {
    next(error);
  }
};
