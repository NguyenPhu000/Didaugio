import express from "express";
import * as districtController from "../controllers/districtController.js";

const router = express.Router();

/**
 * DISTRICT ROUTES
 * Base: /api/districts
 * All routes are public (không cần authentication)
 */

// =============================================================================
// DISTRICT (QUẬN/HUYỆN)
// =============================================================================

// GET /api/districts - Lấy danh sách quận/huyện
router.get("/", districtController.getDistricts);

// GET /api/districts/code/:code - Lấy quận theo code (đặt trước :id để tránh conflict)
router.get("/code/:code", districtController.getDistrictByCode);

// GET /api/districts/:id - Lấy quận theo ID
router.get("/:id", districtController.getDistrictById);

// GET /api/districts/:id/wards - Lấy phường/xã theo quận
router.get("/:id/wards", districtController.getWardsByDistrict);

// POST /api/districts/lookup - Tìm quận theo tọa độ
router.post("/lookup", districtController.lookupDistrict);

export default router;
