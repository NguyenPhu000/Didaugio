import { ROLES } from "../../config/constants.js";
import * as voucherService from "../../services/voucher/voucher.service.js";

export const getAll = async (req, res, next) => {
  try {
    const result = await voucherService.getAll(
      req.query,
      req.user.userId,
      req.user.roleId,
    );
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách voucher thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req, res, next) => {
  try {
    const businessId =
      req.user.roleId > ROLES.ADMIN ? req.business?.id : undefined;
    const voucher = await voucherService.getById(req.params.id, {
      businessId,
    });
    res.json({
      success: true,
      data: voucher,
      message: "Lấy chi tiết voucher thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const voucher = await voucherService.create(req.body, req.user.userId);
    res.status(201).json({
      success: true,
      message: "Tạo voucher thành công",
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const voucher = await voucherService.update(req.params.id, req.body);
    res.json({
      success: true,
      message: "Cập nhật voucher thành công",
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await voucherService.remove(req.params.id);
    res.json({ success: true, message: "Xóa voucher thành công" });
  } catch (error) {
    next(error);
  }
};

export const getUsageStats = async (req, res, next) => {
  try {
    const stats = await voucherService.getUsageStats(req.params.id);
    res.json({
      success: true,
      data: stats,
      message: "Lấy thống kê sử dụng voucher thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeactivate = async (req, res, next) => {
  try {
    const result = await voucherService.bulkDeactivate(
      req.body.voucherIds,
      req.user.userId,
    );
    res.json({
      success: true,
      message: `Đã deactivate ${result.count} voucher`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
