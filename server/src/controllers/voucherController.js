import * as voucherService from "../services/voucherService.js";

export const getAll = async (req, res) => {
  try {
    const result = await voucherService.getAll(
      req.query,
      req.user.userId,
      req.user.roleId,
    );
    res.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const voucher = await voucherService.getById(req.params.id);
    res.json({ success: true, data: voucher });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const voucher = await voucherService.create(req.body, req.user.userId);
    res.status(201).json({
      success: true,
      message: "Tạo voucher thành công",
      data: voucher,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const voucher = await voucherService.update(req.params.id, req.body);
    res.json({
      success: true,
      message: "Cập nhật voucher thành công",
      data: voucher,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    await voucherService.remove(req.params.id);
    res.json({ success: true, message: "Xóa voucher thành công" });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const getUsageStats = async (req, res) => {
  try {
    const stats = await voucherService.getUsageStats(req.params.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const bulkDeactivate = async (req, res) => {
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
    res.status(500).json({ success: false, message: error.message });
  }
};
