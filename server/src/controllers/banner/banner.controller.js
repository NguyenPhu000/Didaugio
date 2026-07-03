import * as bannerService from "../../services/banner/banner.service.js";

const getUserId = (req) => req.user?.userId || req.user?.id || null;

/**
 * POST /api/banners — Tạo banner marketing mới
 */
export const createBanner = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const banner = await bannerService.createBanner(userId, req.body);
    return res.status(201).json({
      success: true,
      data: banner,
      message: "Tạo banner thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/banners/:id — Cập nhật banner marketing
 */
export const updateBanner = async (req, res, next) => {
  try {
    const bannerId = parseInt(req.params.id, 10);
    const banner = await bannerService.updateBanner(bannerId, req.body);
    return res.json({
      success: true,
      data: banner,
      message: "Cập nhật banner thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/banners/:id — Xóa banner marketing
 */
export const deleteBanner = async (req, res, next) => {
  try {
    const bannerId = parseInt(req.params.id, 10);
    await bannerService.deleteBanner(bannerId);
    return res.json({
      success: true,
      data: null,
      message: "Xóa banner thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/banners — Lấy danh sách banner (admin)
 */
export const getBanners = async (req, res, next) => {
  try {
    const result = await bannerService.getBanners(req.query);
    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: "Lấy danh sách banner thành công",
    });
  } catch (error) {
    next(error);
  }
};
