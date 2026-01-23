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

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
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

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
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
 * GET /api/boundaries/style - Lấy MapLibre Style JSON
 */
export const getStyleJSON = async (req, res) => {
  try {
    const style = await boundaryService.getStyleJSON();

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json(style);
  } catch (error) {
    console.error("Error in getStyleJSON:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy Style JSON",
      error: error.message,
    });
  }
};

// =============================================================================
// CENTROID ENDPOINTS
// =============================================================================

/**
 * GET /api/boundaries/districts/:code/center - Lấy tọa độ trung tâm quận/huyện
 */
export const getDistrictCenter = async (req, res) => {
  try {
    const { code } = req.params;
    const centroid = await boundaryService.getDistrictCentroid(code);

    res.json({
      success: true,
      data: centroid,
    });
  } catch (error) {
    console.error("Error in getDistrictCenter:", error);
    
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET /api/boundaries/wards/:id/center - Lấy tọa độ trung tâm phường/xã
 */
export const getWardCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const centroid = await boundaryService.getWardCentroid(parseInt(id));

    res.json({
      success: true,
      data: centroid,
    });
  } catch (error) {
    console.error("Error in getWardCenter:", error);
    
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  getDistrictsGeoJSON,
  getWardsGeoJSON,
  getStyleJSON,
  getDistrictCenter,
  getWardCenter,
};
