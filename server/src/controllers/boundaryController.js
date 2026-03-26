import * as boundaryService from "../services/boundaryService.js";

/**
 * GET /api/boundaries/districts - Lấy GeoJSON quận/huyện
 */
export const getDistrictsGeoJSON = async (req, res, next) => {
  try {
    const geojson = await boundaryService.getDistrictsGeoJSON();
    res.setHeader("Cache-Control", "public, max-age=300"); // 5 min browser cache
    res.json({
      success: true,
      data: geojson,
      message: "Lấy dữ liệu ranh giới quận/huyện thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/boundaries/wards - Lấy GeoJSON phường/xã
 */
export const getWardsGeoJSON = async (req, res, next) => {
  try {
    const geojson = await boundaryService.getWardsGeoJSON();
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({
      success: true,
      data: geojson,
      message: "Lấy dữ liệu ranh giới phường/xã thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/boundaries/cache/invalidate - Xóa cache (admin only)
 */
export const invalidateCache = async (req, res, next) => {
  try {
    boundaryService.invalidateCache(req.body?.key || null);
    res.json({
      success: true,
      data: null,
      message: "Cache invalidated",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/boundaries/districts/:code/center
 */
export const getDistrictCenter = async (req, res, next) => {
  try {
    const { code } = req.params;
    const centroid = await boundaryService.getDistrictCentroid(code);
    res.json({
      success: true,
      data: centroid,
      message: "Lấy tọa độ trung tâm quận/huyện thành công",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/boundaries/wards/:id/center
 */
export const getWardCenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const centroid = await boundaryService.getWardCentroid(id);
    res.json({
      success: true,
      data: centroid,
      message: "Lấy tọa độ trung tâm phường/xã thành công",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getDistrictsGeoJSON,
  getWardsGeoJSON,
  getDistrictCenter,
  getWardCenter,
  invalidateCache,
};
