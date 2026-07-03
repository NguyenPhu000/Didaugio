import * as cmsService from "../../services/cms/cms.service.js";
import { setPublicListCache } from "../../utils/httpCacheHeaders.js";

/**
 * GET /api/cms/explore-landing
 * Aggregate endpoint: trả về toàn bộ CMS data cho màn hình Explore trong 1 request
 */
export const getExploreLanding = async (req, res) => {
  try {
    setPublicListCache(res, req);
    const data = await cmsService.getExploreLandingData();
    return res.status(200).json({
      success: true,
      data,
      message: "Lay du lieu CMS thanh cong",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      data: null,
      message: error.message || "Loi he thong",
      errorCode: error.code || "INTERNAL_ERROR",
    });
  }
};

/**
 * GET /api/cms/banners
 * Lấy danh sách banner marketing đang active
 */
export const getBanners = async (req, res) => {
  try {
    setPublicListCache(res, req);
    const data = await cmsService.getActiveBanners();
    return res.status(200).json({
      success: true,
      data,
      message: "Lay danh sach banner thanh cong",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      data: null,
      message: error.message || "Loi he thong",
      errorCode: error.code || "INTERNAL_ERROR",
    });
  }
};

/**
 * GET /api/cms/featured-places
 * Lấy danh sách địa điểm nổi bật
 */
export const getFeaturedPlaces = async (req, res) => {
  try {
    setPublicListCache(res, req);
    const limit = parseInt(req.query.limit) || 8;
    const data = await cmsService.getFeaturedPlaces({ limit });
    return res.status(200).json({
      success: true,
      data,
      message: "Lay dia diem noi bat thanh cong",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      data: null,
      message: error.message || "Loi he thong",
      errorCode: error.code || "INTERNAL_ERROR",
    });
  }
};

/**
 * GET /api/cms/sample-trips
 * Lấy danh sách lịch trình mẫu công khai
 */
export const getSampleTrips = async (req, res) => {
  try {
    setPublicListCache(res, req);
    const limit = parseInt(req.query.limit) || 6;
    const data = await cmsService.getSampleTrips({ limit });
    return res.status(200).json({
      success: true,
      data,
      message: "Lay lich trinh mau thanh cong",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      data: null,
      message: error.message || "Loi he thong",
      errorCode: error.code || "INTERNAL_ERROR",
    });
  }
};

/**
 * GET /api/cms/announcements
 * Lấy thông báo hệ thống đã gửi (public)
 */
export const getAnnouncements = async (req, res) => {
  try {
    setPublicListCache(res, req);
    const limit = parseInt(req.query.limit) || 5;
    const data = await cmsService.getPublicAnnouncements({ limit });
    return res.status(200).json({
      success: true,
      data,
      message: "Lay thong bao he thong thanh cong",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      data: null,
      message: error.message || "Loi he thong",
      errorCode: error.code || "INTERNAL_ERROR",
    });
  }
};
