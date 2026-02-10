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

/** GET /api/boundaries/districts - GeoJSON quận/huyện */
router.get("/districts", boundaryController.getDistrictsGeoJSON);

/** GET /api/boundaries/wards - GeoJSON phường/xã */
router.get("/wards", boundaryController.getWardsGeoJSON);

// =============================================================================
// CENTROID ROUTES
// =============================================================================

/** GET /api/boundaries/districts/:code/center - Tâm quận/huyện */
router.get("/districts/:code/center", boundaryController.getDistrictCenter);

/** GET /api/boundaries/wards/:id/center - Tâm phường/xã */
router.get("/wards/:id/center", boundaryController.getWardCenter);

// =============================================================================
// CACHE MANAGEMENT
// =============================================================================

/** POST /api/boundaries/cache/invalidate - Xóa cache (admin) */
router.post("/cache/invalidate", boundaryController.invalidateCache);

export default router;
