import * as businessServiceService from "../services/businessServiceService.js";

export const getAll = async (req, res) => {
  try {
    const result = await businessServiceService.getAll(
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
    const service = await businessServiceService.getById(req.params.id);
    res.json({ success: true, data: service });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const service = await businessServiceService.create(req.body, req.user.userId);
    res.status(201).json({
      success: true,
      message: "Tạo dịch vụ thành công",
      data: service,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const service = await businessServiceService.update(req.params.id, req.body);
    res.json({
      success: true,
      message: "Cập nhật dịch vụ thành công",
      data: service,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    await businessServiceService.remove(req.params.id);
    res.json({ success: true, message: "Xóa dịch vụ thành công" });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};
