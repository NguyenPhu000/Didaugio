/**
 * Business Admin Controller - SRP: Xử lý request quản lý doanh nghiệp (Admin)
 */
import * as businessAdminService from "../../services/business/businessAdmin.service.js";

export const getAll = async (req, res, next) => {
  try {
    const result = await businessAdminService.getAll(req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      summary: result.summary,
      message: "Lấy danh sách doanh nghiệp thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const business = await businessAdminService.getById(req.params.id);
    res.json({
      success: true,
      data: business,
      message: "Lấy chi tiết doanh nghiệp thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const approve = async (req, res, next) => {
  try {
    const business = await businessAdminService.approve(
      req.params.id,
      req.body,
      req.user.userId,
    );
    res.json({
      success: true,
      message: "Duyệt doanh nghiệp thành công",
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

export const reject = async (req, res, next) => {
  try {
    const business = await businessAdminService.reject(
      req.params.id,
      req.body.rejectionReason,
      req.user.userId,
    );
    res.json({
      success: true,
      message: "Từ chối doanh nghiệp thành công",
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

export const suspend = async (req, res, next) => {
  try {
    const business = await businessAdminService.suspend(
      req.params.id,
      req.user.userId,
    );
    res.json({
      success: true,
      message: "Tạm ngưng doanh nghiệp thành công",
      data: business,
    });
  } catch (error) {
    next(error);
  }
};

export const reactivate = async (req, res, next) => {
  try {
    const business = await businessAdminService.reactivate(
      req.params.id,
      req.user.userId,
    );
    res.json({
      success: true,
      message: "Kích hoạt lại doanh nghiệp thành công",
      data: business,
    });
  } catch (error) {
    next(error);
  }
};
