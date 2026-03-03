import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { requirePermission } from "../middlewares/permissionMiddleware.js";
import { blockGuestFromAdmin } from "../middlewares/blockGuestFromAdmin.js";

const router = express.Router();

router.use(authenticate, blockGuestFromAdmin);

router.get(
  "/",
  authenticate,
  requirePermission("settings.view"),
  async (req, res) => {
    res.json({
      success: true,
      data: {
        siteName: "Đi Đâu Giờ?",
        siteDescription: "Khám phá Cần Thơ",
        version: "1.0.0",
      },
      message: "Settings retrieved successfully",
    });
  },
);

router.put(
  "/",
  authenticate,
  requirePermission("settings.update"),
  async (req, res) => {
    res.json({
      success: true,
      data: req.body,
      message: "Settings updated successfully",
    });
  },
);

export default router;
