/**
 * BOUNDARY ROUTES
 * Định nghĩa endpoints cho ranh giới địa lý Cần Thơ
 * Base: /api/boundaries
 */

import express from "express";
import * as boundaryController from "../controllers/boundaryController.js";

const router = express.Router();

// =============================================================================
// GEOJSON ROUTES
// =============================================================================

/**
 * @route   GET /api/boundaries/districts
 * @desc    Lấy GeoJSON quận/huyện Cần Thơ
 * @access  Public
 */
router.get("/districts", boundaryController.getDistrictsGeoJSON);

/**
 * @route   GET /api/boundaries/wards
 * @desc    Lấy GeoJSON phường/xã Cần Thơ
 * @access  Public
 */
router.get("/wards", boundaryController.getWardsGeoJSON);

/**
 * @route   GET /api/boundaries/style
 * @desc    Lấy MapLibre Style JSON cho bản đồ Cần Thơ
 * @access  Public
 */
router.get("/style", boundaryController.getStyleJSON);

// =============================================================================
// CENTROID ROUTES
// =============================================================================

/**
 * @route   GET /api/boundaries/districts/:code/center
 * @desc    Lấy tọa độ trung tâm của quận/huyện theo code
 * @access  Public
 */
router.get("/districts/:code/center", boundaryController.getDistrictCenter);

/**
 * @route   GET /api/boundaries/wards/:id/center
 * @desc    Lấy tọa độ trung tâm của phường/xã theo ID
 * @access  Public
 */
router.get("/wards/:id/center", boundaryController.getWardCenter);

export default router;
