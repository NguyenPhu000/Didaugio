/**
 * Business Offering Controller - CRUD dịch vụ/sản phẩm doanh nghiệp cung cấp
 */
import { ROLES } from "../config/constants.js";
import * as businessOfferingService from "../services/businessOfferingService.js";

export const getAll = async (req, res, next) => {
  try {
    const result = await businessOfferingService.getAll(
      req.query,
      req.user.userId,
      req.user.roleId,
    );
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách dịch vụ thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const businessId =
      req.user.roleId > ROLES.ADMIN ? req.business?.id : undefined;
    const offering = await businessOfferingService.getById(req.params.id, {
      businessId,
    });
    res.json({
      success: true,
      data: offering,
      message: "Lấy chi tiết dịch vụ thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const offering = await businessOfferingService.create(
      req.body,
      req.user.userId,
    );
    res.status(201).json({
      success: true,
      message: "Tạo dịch vụ thành công",
      data: offering,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const businessId =
      req.user.roleId > ROLES.ADMIN ? req.business?.id : undefined;
    const offering = await businessOfferingService.update(
      req.params.id,
      req.body,
      { businessId },
    );
    res.json({
      success: true,
      message: "Cập nhật dịch vụ thành công",
      data: offering,
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    const businessId =
      req.user.roleId > ROLES.ADMIN ? req.business?.id : undefined;
    await businessOfferingService.remove(req.params.id, { businessId });
    res.json({ success: true, message: "Xóa dịch vụ thành công" });
  } catch (error) {
    next(error);
  }
};
