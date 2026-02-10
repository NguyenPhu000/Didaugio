/**
 * BOUNDARY CONTROLLER
 * Xử lý request/response cho ranh giới địa lý
 */

import * as boundaryService from "../services/boundaryService.js";

// =============================================================================
// GEOJSON ENDPOINTS
// =============================================================================

/**
 * GET /api/boundaries/districts - Lấy GeoJSON quận/huyện
 */
export const getDistrictsGeoJSON = async (req, res) => {
  try {
    const geojson = await boundaryService.getDistrictsGeoJSON();
    res.setHeader("Cache-Control", "public, max-age=300"); // 5 min browser cache
    res.json(geojson);
  } catch (error) {
    console.error("Error in getDistrictsGeoJSON:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy dữ liệu GeoJSON quận/huyện",
      error: error.message,
    });
  }
};

/**
 * GET /api/boundaries/wards - Lấy GeoJSON phường/xã
 */
export const getWardsGeoJSON = async (req, res) => {
  try {
    const geojson = await boundaryService.getWardsGeoJSON();
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json(geojson);
  } catch (error) {
    console.error("Error in getWardsGeoJSON:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy dữ liệu GeoJSON phường/xã",
      error: error.message,
    });
  }
};

/**
 * POST /api/boundaries/cache/invalidate - Xóa cache (admin only)
 */
export const invalidateCache = async (req, res) => {
  try {
    boundaryService.invalidateCache();
    res.json({ success: true, message: "Cache invalidated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =============================================================================
// CENTROID ENDPOINTS
// =============================================================================

/**
 * GET /api/boundaries/districts/:code/center
 */
export const getDistrictCenter = async (req, res) => {
  try {
    const { code } = req.params;
    const centroid = await boundaryService.getDistrictCentroid(code);
    res.json({ success: true, data: centroid });
  } catch (error) {
    console.error("Error in getDistrictCenter:", error);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/boundaries/wards/:id/center
 */
export const getWardCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const centroid = await boundaryService.getWardCentroid(parseInt(id));
    res.json({ success: true, data: centroid });
  } catch (error) {
    console.error("Error in getWardCenter:", error);
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ success: false, message: error.message });
  }
};

export default {
  getDistrictsGeoJSON,
  getWardsGeoJSON,
  getDistrictCenter,
  getWardCenter,
  invalidateCache,
};
