import * as businessService from "../services/businessService.js";

export const getProfile = async (req, res) => {
  try {
    const business = await businessService.getProfile(req.user.userId);
    res.json({ success: true, data: business });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const register = async (req, res) => {
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

    const business = await businessService.register(data, req.user.userId);
    res.status(201).json({
      success: true,
      message: "Đăng ký doanh nghiệp thành công, đang chờ duyệt",
      data: business,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const previousBusiness = await businessService.getProfile(req.user.userId);
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

    const business = await businessService.updateProfile(data, req.user.userId);

    const isResubmitted =
      previousBusiness?.status === "rejected" && business?.status === "pending";

    res.json({
      success: true,
      message: isResubmitted
        ? "Cập nhật hồ sơ thành công và đã gửi duyệt lại"
        : "Cập nhật hồ sơ thành công",
      data: business,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const stats = await businessService.getDashboard(req.user.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const result = await businessService.getAll(req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const business = await businessService.getById(req.params.id);
    res.json({ success: true, data: business });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export const approve = async (req, res) => {
  try {
    const business = await businessService.approve(
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
    console.error("[businessController.approve]", error?.stack || error);
    const statusCode = error.statusCode || 500;
    const payload = {
      success: false,
      message: error.message || "Lỗi duyệt doanh nghiệp",
    };
    if (process.env.NODE_ENV !== "production") {
      payload.debug = error.message;
      payload.code = error.code;
    }
    res.status(statusCode).json(payload);
  }
};

export const reject = async (req, res) => {
  try {
    const business = await businessService.reject(
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
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};
