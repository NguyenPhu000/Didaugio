import express from "express";
import * as districtController from "../../controllers/district/district.controller.js";

const router = express.Router();

/**
 * WARD ROUTES
 * Base: /api/wards
 * All routes are public (không cần authentication)
 */

// GET /api/wards - Lấy tất cả phường/xã (có pagination)
router.get("/", districtController.getAllWards);

// GET /api/wards/code/:code - Lấy phường theo code
router.get("/code/:code", districtController.getWardByCode);

// GET /api/wards/:id - Lấy phường theo ID
router.get("/:id", districtController.getWardById);

export default router;
